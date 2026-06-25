import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveIdentifier, resolvePds, resolvePublicationUri } from "./resolve.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  // Clear PDS cache between tests by re-importing would require module reset;
  // instead we rely on unique DIDs per test to avoid cache collisions.
});

describe("resolveIdentifier", () => {
  it("returns DID unchanged when already a DID", async () => {
    const did = "did:plc:abc123";
    expect(await resolveIdentifier(did)).toBe(did);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("resolves a handle to a DID", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ did: "did:plc:resolved" }),
    });

    const result = await resolveIdentifier("alice.bsky.social");
    expect(result).toBe("did:plc:resolved");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("alice.bsky.social"),
      expect.any(Object)
    );
  });

  it("caches handle resolution — only one fetch for the same handle", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ did: "did:plc:cached-handle" }),
    });

    await resolveIdentifier("cached.handle.bsky.social");
    await resolveIdentifier("cached.handle.bsky.social");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("throws when handle resolution fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Not Found" });
    await expect(resolveIdentifier("unknown.handle")).rejects.toThrow(
      "Failed to resolve handle"
    );
  });
});

describe("resolvePublicationUri", () => {
  it("returns AT URI for a publication given a handle", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ did: "did:plc:pub1" }),
    });

    const result = await resolvePublicationUri("author.bsky.social", "my-blog");
    expect(result).toBe("at://did:plc:pub1/site.standard.publication/my-blog");
  });

  it("returns AT URI for a publication given a DID directly", async () => {
    const result = await resolvePublicationUri("did:plc:pub2", "my-blog");
    expect(result).toBe("at://did:plc:pub2/site.standard.publication/my-blog");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("resolvePds", () => {
  it("fetches PDS from plc.directory for did:plc", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        service: [
          { id: "#atproto_pds", serviceEndpoint: "https://bsky.social" },
        ],
      }),
    });

    const result = await resolvePds("did:plc:unique1");
    expect(result).toBe("https://bsky.social");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://plc.directory/did%3Aplc%3Aunique1",
      expect.any(Object)
    );
  });

  it("fetches PDS from well-known URL for did:web", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        service: [
          { id: "#atproto_pds", serviceEndpoint: "https://pds.example.com" },
        ],
      }),
    });

    const result = await resolvePds("did:web:example.com");
    expect(result).toBe("https://pds.example.com");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/.well-known/did.json",
      expect.any(Object)
    );
  });

  it("caches PDS resolution — only one fetch for the same DID", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        service: [{ id: "#atproto_pds", serviceEndpoint: "https://bsky.social" }],
      }),
    });

    const did = "did:plc:cached1";
    await resolvePds(did);
    await resolvePds(did);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("throws when DID document has no PDS service", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ service: [] }),
    });

    await expect(resolvePds("did:plc:nopds1")).rejects.toThrow(
      "No PDS service found"
    );
  });

  it("throws for unsupported DID methods", async () => {
    await expect(resolvePds("did:key:abc123")).rejects.toThrow(
      "Unsupported DID method"
    );
  });
});
