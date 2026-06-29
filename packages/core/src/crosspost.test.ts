import { describe, it, expect, vi, beforeEach } from "vitest";
import { crossPostToBluesky } from "./crosspost.js";

const BASE_PARAMS = {
  did: "did:plc:abc123",
  documentUri: "at://did:plc:abc123/site.standard.document/3tid000001",
  documentCid: "bafyreiabc",
  publicationUri: "at://did:plc:abc123/site.standard.publication/3tid000002",
  publicationCid: "bafyreidef",
  canonicalUrl: "https://example.com/blog/my-article",
  title: "My Article",
  text: "My Article https://example.com/blog/my-article",
};

function makeAgent(uri = "at://did:plc:abc123/app.bsky.feed.post/3postid", cid = "bafyreipost") {
  const createRecord = vi.fn().mockResolvedValue({ data: { uri, cid } });
  return {
    com: { atproto: { repo: { createRecord } } },
    createRecord,
  };
}

describe("crossPostToBluesky", () => {
  it("creates a post record with the correct collection", async () => {
    const agent = makeAgent();
    await crossPostToBluesky(agent, BASE_PARAMS);
    expect(agent.createRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        repo: "did:plc:abc123",
        collection: "app.bsky.feed.post",
      }),
    );
  });

  it("sets the correct $type and text on the record", async () => {
    const agent = makeAgent();
    await crossPostToBluesky(agent, BASE_PARAMS);
    const record = agent.createRecord.mock.calls[0][0].record;
    expect(record.$type).toBe("app.bsky.feed.post");
    expect(record.text).toBe(BASE_PARAMS.text);
  });

  it("sets createdAt on the record", async () => {
    const agent = makeAgent();
    await crossPostToBluesky(agent, BASE_PARAMS);
    const record = agent.createRecord.mock.calls[0][0].record;
    expect(typeof record.createdAt).toBe("string");
    expect(() => new Date(record.createdAt as string)).not.toThrow();
  });

  it("embeds the canonical URL, title, and empty description by default", async () => {
    const agent = makeAgent();
    await crossPostToBluesky(agent, BASE_PARAMS);
    const record = agent.createRecord.mock.calls[0][0].record;
    const embed = record.embed as Record<string, unknown>;
    const external = embed.external as Record<string, unknown>;
    expect(embed.$type).toBe("app.bsky.embed.external");
    expect(external.uri).toBe(BASE_PARAMS.canonicalUrl);
    expect(external.title).toBe(BASE_PARAMS.title);
    expect(external.description).toBe("");
  });

  it("includes description in the embed when provided", async () => {
    const agent = makeAgent();
    await crossPostToBluesky(agent, { ...BASE_PARAMS, description: "An intro." });
    const record = agent.createRecord.mock.calls[0][0].record;
    const external = (record.embed as Record<string, unknown>).external as Record<string, unknown>;
    expect(external.description).toBe("An intro.");
  });

  it("includes associatedRefs for both document and publication", async () => {
    const agent = makeAgent();
    await crossPostToBluesky(agent, BASE_PARAMS);
    const record = agent.createRecord.mock.calls[0][0].record;
    const external = (record.embed as Record<string, unknown>).external as Record<string, unknown>;
    const refs = external.associatedRefs as Array<Record<string, unknown>>;
    expect(refs).toHaveLength(2);
    expect(refs[0]).toEqual({
      $type: "com.atproto.repo.strongRef",
      uri: BASE_PARAMS.documentUri,
      cid: BASE_PARAMS.documentCid,
    });
    expect(refs[1]).toEqual({
      $type: "com.atproto.repo.strongRef",
      uri: BASE_PARAMS.publicationUri,
      cid: BASE_PARAMS.publicationCid,
    });
  });

  it("includes thumbBlob in the embed when provided", async () => {
    const agent = makeAgent();
    const thumbBlob = { $type: "blob", ref: { $link: "bafyreithumb" }, mimeType: "image/webp", size: 12345 };
    await crossPostToBluesky(agent, { ...BASE_PARAMS, thumbBlob });
    const record = agent.createRecord.mock.calls[0][0].record;
    const external = (record.embed as Record<string, unknown>).external as Record<string, unknown>;
    expect(external.thumb).toEqual(thumbBlob);
  });

  it("omits thumb from the embed when thumbBlob is not provided", async () => {
    const agent = makeAgent();
    await crossPostToBluesky(agent, BASE_PARAMS);
    const record = agent.createRecord.mock.calls[0][0].record;
    const external = (record.embed as Record<string, unknown>).external as Record<string, unknown>;
    expect(external.thumb).toBeUndefined();
  });

  it("returns the uri and cid of the created post", async () => {
    const agent = makeAgent("at://did:plc:abc123/app.bsky.feed.post/3postid", "bafyreipost");
    const result = await crossPostToBluesky(agent, BASE_PARAMS);
    expect(result).toEqual({ uri: "at://did:plc:abc123/app.bsky.feed.post/3postid", cid: "bafyreipost" });
  });
});
