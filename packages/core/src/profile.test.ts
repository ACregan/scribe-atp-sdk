import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchProfile } from "./profile.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

function makeProfileResponse(overrides: object = {}) {
  return {
    ok: true,
    json: async () => ({
      did: "did:plc:testuser",
      handle: "alice.bsky.social",
      displayName: "Alice",
      description: "Writer and photographer",
      avatar: "https://cdn.bsky.app/avatar.jpg",
      ...overrides,
    }),
  };
}

describe("fetchProfile", () => {
  it("calls getProfile with the actor param set to the given handle or DID", async () => {
    mockFetch.mockResolvedValueOnce(makeProfileResponse());
    await fetchProfile("alice.bsky.social");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=alice.bsky.social",
      expect.any(Object),
    );
  });

  it("URL-encodes the handle/DID", async () => {
    mockFetch.mockResolvedValueOnce(makeProfileResponse());
    await fetchProfile("did:plc:testuser");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=did%3Aplc%3Atestuser",
      expect.any(Object),
    );
  });

  it("does not call resolveHandle first — passes the identifier straight through", async () => {
    mockFetch.mockResolvedValueOnce(makeProfileResponse());
    await fetchProfile("did:plc:testuser");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("returns the core profile fields", async () => {
    mockFetch.mockResolvedValueOnce(makeProfileResponse());
    const profile = await fetchProfile("alice.bsky.social");
    expect(profile).toMatchObject({
      did: "did:plc:testuser",
      handle: "alice.bsky.social",
      displayName: "Alice",
      description: "Writer and photographer",
      avatar: "https://cdn.bsky.app/avatar.jpg",
    });
  });

  it("passes through the extended profileViewDetailed fields", async () => {
    mockFetch.mockResolvedValueOnce(
      makeProfileResponse({
        pronouns: "she/her",
        website: "https://alice.example.com",
        banner: "https://cdn.bsky.app/banner.jpg",
        followersCount: 120,
        followsCount: 80,
        postsCount: 340,
        createdAt: "2023-01-01T00:00:00.000Z",
        associated: { lists: 2, feedgens: 0, starterPacks: 1, labeler: false },
        pinnedPost: { uri: "at://did:plc:testuser/app.bsky.feed.post/1", cid: "bafyreipost" },
        verification: {
          verifiedStatus: "valid",
          trustedVerifierStatus: "none",
          verifications: [],
        },
        status: { status: "app.bsky.actor.status#live", isActive: true },
      }),
    );
    const profile = await fetchProfile("alice.bsky.social");
    expect(profile.pronouns).toBe("she/her");
    expect(profile.website).toBe("https://alice.example.com");
    expect(profile.banner).toBe("https://cdn.bsky.app/banner.jpg");
    expect(profile.followersCount).toBe(120);
    expect(profile.followsCount).toBe(80);
    expect(profile.postsCount).toBe(340);
    expect(profile.createdAt).toBe("2023-01-01T00:00:00.000Z");
    expect(profile.associated).toEqual({ lists: 2, feedgens: 0, starterPacks: 1, labeler: false });
    expect(profile.pinnedPost).toEqual({
      uri: "at://did:plc:testuser/app.bsky.feed.post/1",
      cid: "bafyreipost",
    });
    expect(profile.verification).toEqual({
      verifiedStatus: "valid",
      trustedVerifierStatus: "none",
      verifications: [],
    });
    expect(profile.status).toEqual({ status: "app.bsky.actor.status#live", isActive: true });
  });

  it("does not leak viewer/indexedAt/labels/$type onto the returned object", async () => {
    mockFetch.mockResolvedValueOnce(
      makeProfileResponse({
        $type: "app.bsky.actor.defs#profileViewDetailed",
        viewer: { muted: false },
        indexedAt: "2026-01-01T00:00:00.000Z",
        labels: [],
      }),
    );
    const profile = (await fetchProfile("alice.bsky.social")) as unknown as Record<string, unknown>;
    expect(profile.$type).toBeUndefined();
    expect(profile.viewer).toBeUndefined();
    expect(profile.indexedAt).toBeUndefined();
    expect(profile.labels).toBeUndefined();
  });

  it("throws a descriptive error when the request fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Not Found" });
    await expect(fetchProfile("nonexistent.bsky.social")).rejects.toThrow(
      'Failed to fetch profile for "nonexistent.bsky.social": Not Found',
    );
  });

  it("passes the abort signal through to fetch", async () => {
    mockFetch.mockResolvedValueOnce(makeProfileResponse());
    const controller = new AbortController();
    await fetchProfile("alice.bsky.social", controller.signal);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});
