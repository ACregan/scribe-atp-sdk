import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@scribe-atp/core", () => ({
  resolveDocumentUri: vi.fn(),
}));

vi.mock("#app", () => ({
  useAsyncData: vi.fn(),
}));

import { resolveDocumentUri } from "@scribe-atp/core";
import { useAsyncData } from "#app";
import { useScribeDocumentUri } from "./useScribeDocumentUri.js";

const mockResolveDocumentUri = vi.mocked(resolveDocumentUri);
const mockUseAsyncData = vi.mocked(useAsyncData);

beforeEach(() => {
  vi.resetAllMocks();
  mockUseAsyncData.mockReturnValue({ data: null, pending: false, error: null } as any);
});

describe("useScribeDocumentUri", () => {
  it("generates the correct useAsyncData key", () => {
    useScribeDocumentUri("alice.bsky.social", "hello");
    expect(mockUseAsyncData).toHaveBeenCalledWith(
      "scribe:document-uri:alice.bsky.social:hello",
      expect.any(Function),
      undefined
    );
  });

  it("handler calls resolveDocumentUri with correct args", async () => {
    mockResolveDocumentUri.mockResolvedValueOnce("at://did:plc:abc/site.standard.document/hello");
    (mockUseAsyncData as any).mockImplementation((_key: any, handler: any) => {
      handler();
      return {};
    });
    useScribeDocumentUri("alice.bsky.social", "hello");
    expect(mockResolveDocumentUri).toHaveBeenCalledWith("alice.bsky.social", "hello");
  });

  it("passes options through to useAsyncData", () => {
    useScribeDocumentUri("alice.bsky.social", "hello", { lazy: true });
    expect(mockUseAsyncData).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      { lazy: true }
    );
  });

  it("returns the result of useAsyncData", () => {
    const mockReturn = { data: "at://did:plc:abc/site.standard.document/hello", pending: false, error: null } as unknown as any;
    mockUseAsyncData.mockReturnValueOnce(mockReturn);
    const result = useScribeDocumentUri("alice.bsky.social", "hello");
    expect(result).toBe(mockReturn);
  });
});
