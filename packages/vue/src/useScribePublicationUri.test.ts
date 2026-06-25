import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { useScribePublicationUri } from "./useScribePublicationUri.js";

vi.mock("@scribe-atp/core", () => ({
  resolvePublicationUri: vi.fn(),
}));

import { resolvePublicationUri } from "@scribe-atp/core";
const mockResolvePublicationUri = vi.mocked(resolvePublicationUri);

const PUBLICATION_URI = "at://did:plc:abc/site.standard.publication/3jxtctq7kqm2y";

function makeWrapper(author: string, publicationUrl: string) {
  let result: ReturnType<typeof useScribePublicationUri>;
  const Component = defineComponent({
    setup() {
      result = useScribePublicationUri(author, publicationUrl);
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

describe("useScribePublicationUri", () => {
  it("starts with loading true and uri null", () => {
    mockResolvePublicationUri.mockReturnValue(new Promise(() => {}));
    const { getResult } = makeWrapper("alice.bsky.social", "https://alice.bsky.social");
    expect(getResult().loading.value).toBe(true);
    expect(getResult().uri.value).toBeNull();
    expect(getResult().error.value).toBeNull();
  });

  it("sets uri and clears loading on resolve", async () => {
    mockResolvePublicationUri.mockResolvedValueOnce(PUBLICATION_URI);
    const { getResult } = makeWrapper("alice.bsky.social", "https://alice.bsky.social");
    await nextTick();
    await nextTick();
    expect(getResult().uri.value).toBe(PUBLICATION_URI);
    expect(getResult().loading.value).toBe(false);
  });

  it("sets error and clears loading on reject", async () => {
    mockResolvePublicationUri.mockRejectedValueOnce(new Error("failed"));
    const { getResult } = makeWrapper("alice.bsky.social", "https://alice.bsky.social");
    await nextTick();
    await nextTick();
    expect(getResult().error.value?.message).toBe("failed");
    expect(getResult().loading.value).toBe(false);
  });

  it("aborts the request on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;
    mockResolvePublicationUri.mockImplementation((_a, _s, signal) => {
      capturedSignal = signal;
      return new Promise(() => {});
    });
    const { wrapper } = makeWrapper("alice.bsky.social", "https://alice.bsky.social");
    await wrapper.unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("ignores AbortError on unmount", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    mockResolvePublicationUri.mockRejectedValueOnce(abortError);
    const { getResult } = makeWrapper("alice.bsky.social", "https://alice.bsky.social");
    await nextTick();
    await nextTick();
    expect(getResult().error.value).toBeNull();
  });
});
