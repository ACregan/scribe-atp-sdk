import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { useScribeSite } from "./useScribeSite.js";

vi.mock("@scribe-atp/core", () => ({
  fetchSite: vi.fn(),
}));

import { fetchSite } from "@scribe-atp/core";
const mockFetchSite = vi.mocked(fetchSite);

const mockSite = {
  title: "Test Site",
  url: "test.com",
  urlPrefix: "blog",
  groups: [],
  ungroupedArticles: [],
};

function makeWrapper(author: string, slug: string) {
  let result: ReturnType<typeof useScribeSite>;
  const Component = defineComponent({
    setup() {
      result = useScribeSite(author, slug);
      return result;
    },
    template: "<div/>",
  });
  const wrapper = mount(Component);
  return { wrapper, getResult: () => result };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useScribeSite", () => {
  it("starts with loading true and site null", () => {
    mockFetchSite.mockReturnValue(new Promise(() => {}));
    const { getResult } = makeWrapper("alice.bsky.social", "alice-bsky-social");
    expect(getResult().loading.value).toBe(true);
    expect(getResult().site.value).toBeNull();
    expect(getResult().error.value).toBeNull();
  });

  it("sets site and clears loading on resolve", async () => {
    mockFetchSite.mockResolvedValueOnce(mockSite);
    const { getResult } = makeWrapper("alice.bsky.social", "alice-bsky-social");
    await nextTick();
    await nextTick();
    expect(getResult().site.value).toEqual(mockSite);
    expect(getResult().loading.value).toBe(false);
    expect(getResult().error.value).toBeNull();
  });

  it("sets error and clears loading on reject", async () => {
    mockFetchSite.mockRejectedValueOnce(new Error("fetch failed"));
    const { getResult } = makeWrapper("alice.bsky.social", "alice-bsky-social");
    await nextTick();
    await nextTick();
    expect(getResult().error.value?.message).toBe("fetch failed");
    expect(getResult().loading.value).toBe(false);
    expect(getResult().site.value).toBeNull();
  });

  it("aborts the request on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;
    mockFetchSite.mockImplementation((_a, _s, signal) => {
      capturedSignal = signal;
      return new Promise(() => {});
    });
    const { wrapper } = makeWrapper("alice.bsky.social", "alice-bsky-social");
    await wrapper.unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("ignores AbortError on unmount", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    mockFetchSite.mockRejectedValueOnce(abortError);
    const { getResult } = makeWrapper("alice.bsky.social", "alice-bsky-social");
    await nextTick();
    await nextTick();
    expect(getResult().error.value).toBeNull();
  });

  it("calls fetchSite with author and siteSlug", () => {
    mockFetchSite.mockReturnValue(new Promise(() => {}));
    makeWrapper("alice.bsky.social", "alice-bsky-social");
    expect(mockFetchSite).toHaveBeenCalledWith(
      "alice.bsky.social",
      "alice-bsky-social",
      expect.any(AbortSignal)
    );
  });
});
