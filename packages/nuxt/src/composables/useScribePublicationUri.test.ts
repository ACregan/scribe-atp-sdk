import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@scribe-atp/core", () => ({
  resolvePublicationUri: vi.fn(),
}));

vi.mock("#app", () => ({
  useAsyncData: vi.fn(),
}));

import { resolvePublicationUri } from "@scribe-atp/core";
import { useAsyncData } from "#app";
import { useScribePublicationUri } from "./useScribePublicationUri.js";

const mockResolvePublicationUri = vi.mocked(resolvePublicationUri);
const mockUseAsyncData = vi.mocked(useAsyncData);

beforeEach(() => {
  vi.resetAllMocks();
  mockUseAsyncData.mockReturnValue({ data: null, pending: false, error: null } as any);
});

describe("useScribePublicationUri", () => {
  it("generates the correct useAsyncData key", () => {
    useScribePublicationUri("alice.bsky.social", "my-blog");
    expect(mockUseAsyncData).toHaveBeenCalledWith(
      "scribe:publication-uri:alice.bsky.social:my-blog",
      expect.any(Function),
      undefined
    );
  });

  it("handler calls resolvePublicationUri with correct args", async () => {
    mockResolvePublicationUri.mockResolvedValueOnce("at://did:plc:abc/site.standard.publication/my-blog");
    (mockUseAsyncData as any).mockImplementation((_key: any, handler: any) => {
      handler();
      return {};
    });
    useScribePublicationUri("alice.bsky.social", "my-blog");
    expect(mockResolvePublicationUri).toHaveBeenCalledWith("alice.bsky.social", "my-blog");
  });

  it("passes options through to useAsyncData", () => {
    useScribePublicationUri("alice.bsky.social", "my-blog", { lazy: true });
    expect(mockUseAsyncData).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      { lazy: true }
    );
  });

  it("returns the result of useAsyncData", () => {
    const mockReturn = { data: "at://did:plc:abc/site.standard.publication/my-blog", pending: false, error: null } as unknown as any;
    mockUseAsyncData.mockReturnValueOnce(mockReturn);
    const result = useScribePublicationUri("alice.bsky.social", "my-blog");
    expect(result).toBe(mockReturn);
  });
});
