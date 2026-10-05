import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { useScribeArticleBySlug } from "./useScribeArticleBySlug.js";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchArticleBySlug: vi.fn(),
}));

import { fetchArticleBySlug } from "@skyscribe-sdk/core";
const mockFetch = vi.mocked(fetchArticleBySlug);

const mockArticle = {
  title: "Hello World",
  content: "<p>Hello</p>",
  path: "/blog/essays/hello",
  site: "at://did:plc:test/site.standard.publication/3mp4nd46xwr2h",
  publishedAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};
const uri = "at://did:plc:test/site.standard.document/3mp47vvkh342n";

function makeWrapper(slug: string) {
  let result: ReturnType<typeof useScribeArticleBySlug>;
  const Component = defineComponent({
    setup() {
      result = useScribeArticleBySlug("alice.bsky.social", "https://example.com", slug);
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

describe("useScribeArticleBySlug", () => {
  it("starts loading with no article or uri", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const { getResult } = makeWrapper("hello");
    expect(getResult().loading.value).toBe(true);
    expect(getResult().article.value).toBeNull();
    expect(getResult().uri.value).toBeNull();
  });

  it("sets the article and its AT URI on resolve", async () => {
    mockFetch.mockResolvedValueOnce({ article: mockArticle, uri });
    const { getResult } = makeWrapper("hello");
    await nextTick();
    await nextTick();
    expect(getResult().article.value).toEqual(mockArticle);
    expect(getResult().uri.value).toBe(uri);
    expect(getResult().loading.value).toBe(false);
    expect(mockFetch).toHaveBeenCalledWith(
      "alice.bsky.social",
      "https://example.com",
      "hello",
      expect.any(AbortSignal)
    );
  });

  it("sets error on reject", async () => {
    mockFetch.mockRejectedValueOnce(new Error("not found"));
    const { getResult } = makeWrapper("hello");
    await nextTick();
    await nextTick();
    expect(getResult().error.value?.message).toBe("not found");
    expect(getResult().loading.value).toBe(false);
  });

  it("aborts the request on unmount", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const { wrapper } = makeWrapper("hello");
    const signal = mockFetch.mock.calls[0][3] as AbortSignal;
    wrapper.unmount();
    expect(signal.aborted).toBe(true);
  });
});
