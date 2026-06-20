import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSite } from "./useSite.js";

vi.mock("@scribe-atp/core", () => ({
  fetchSite: vi.fn(),
}));

import { fetchSite } from "@scribe-atp/core";
const mockFetchSite = vi.mocked(fetchSite);

const site = {
  title: "Test Site",
  url: "example.com",
  urlPrefix: "blog",
  groups: [],
  ungroupedArticles: [],
};

beforeEach(() => mockFetchSite.mockReset());

describe("useSite", () => {
  it("starts in loading state", async () => {
    const { promise, resolve } = Promise.withResolvers<typeof site>();
    mockFetchSite.mockReturnValueOnce(promise);
    const { result } = renderHook(() => useSite("did:plc:test", "example-com"));
    expect(result.current.loading).toBe(true);
    expect(result.current.site).toBeNull();
    expect(result.current.error).toBeNull();
    resolve(site);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets site data on success", async () => {
    mockFetchSite.mockResolvedValueOnce(site);
    const { result } = renderHook(() => useSite("did:plc:test", "example-com"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.site).toEqual(site);
    expect(result.current.error).toBeNull();
  });

  it("sets error on failure", async () => {
    mockFetchSite.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useSite("did:plc:test", "example-com"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("Network error");
    expect(result.current.site).toBeNull();
  });

  it("re-fetches when params change", async () => {
    mockFetchSite.mockResolvedValue(site);
    const { result, rerender } = renderHook(
      ({ author, slug }: { author: string; slug: string }) =>
        useSite(author, slug),
      { initialProps: { author: "did:plc:test", slug: "site-one" } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ author: "did:plc:test", slug: "site-two" });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchSite).toHaveBeenCalledTimes(2);
  });

  it("aborts on unmount", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    const { promise, reject } = Promise.withResolvers<typeof site>();
    mockFetchSite.mockReturnValueOnce(promise);
    const { unmount } = renderHook(() => useSite("did:plc:test", "example-com"));
    unmount();
    expect(abortSpy).toHaveBeenCalled();
    reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    abortSpy.mockRestore();
  });
});
