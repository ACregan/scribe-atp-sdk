import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { useScribeArticle } from "./useScribeArticle.js";

vi.mock("@scribe-atp/core", () => ({
  fetchArticle: vi.fn(),
}));

import { fetchArticle } from "@scribe-atp/core";
const mockFetchArticle = vi.mocked(fetchArticle);

const mockArticle = {
  title: "Hello World",
  content: "<p>Hello</p>",
  path: "/hello",
  site: "https://example.com",
  publishedAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

function makeWrapper(author: string, slug: string) {
  let result: ReturnType<typeof useScribeArticle>;
  const Component = defineComponent({
    setup() {
      result = useScribeArticle(author, slug);
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

describe("useScribeArticle", () => {
  it("starts with loading true and article null", () => {
    mockFetchArticle.mockReturnValue(new Promise(() => {}));
    const { getResult } = makeWrapper("alice.bsky.social", "hello");
    expect(getResult().loading.value).toBe(true);
    expect(getResult().article.value).toBeNull();
    expect(getResult().error.value).toBeNull();
  });

  it("sets article and clears loading on resolve", async () => {
    mockFetchArticle.mockResolvedValueOnce(mockArticle);
    const { getResult } = makeWrapper("alice.bsky.social", "hello");
    await nextTick();
    await nextTick();
    expect(getResult().article.value).toEqual(mockArticle);
    expect(getResult().loading.value).toBe(false);
  });

  it("sets error and clears loading on reject", async () => {
    mockFetchArticle.mockRejectedValueOnce(new Error("not found"));
    const { getResult } = makeWrapper("alice.bsky.social", "hello");
    await nextTick();
    await nextTick();
    expect(getResult().error.value?.message).toBe("not found");
    expect(getResult().loading.value).toBe(false);
  });

  it("aborts the request on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;
    mockFetchArticle.mockImplementation((_a, _s, signal) => {
      capturedSignal = signal;
      return new Promise(() => {});
    });
    const { wrapper } = makeWrapper("alice.bsky.social", "hello");
    await wrapper.unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("ignores AbortError on unmount", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    mockFetchArticle.mockRejectedValueOnce(abortError);
    const { getResult } = makeWrapper("alice.bsky.social", "hello");
    await nextTick();
    await nextTick();
    expect(getResult().error.value).toBeNull();
  });

  it("calls fetchArticle with author and articleSlug", () => {
    mockFetchArticle.mockReturnValue(new Promise(() => {}));
    makeWrapper("alice.bsky.social", "hello");
    expect(mockFetchArticle).toHaveBeenCalledWith(
      "alice.bsky.social",
      "hello",
      expect.any(AbortSignal)
    );
  });
});
