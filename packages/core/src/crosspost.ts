export interface StrongRef {
  uri: string;
  cid: string;
}

export interface CrossPostParams {
  did: string;
  documentUri: string;
  documentCid: string;
  publicationUri: string;
  publicationCid: string;
  canonicalUrl: string;
  title: string;
  text: string;
  description?: string;
  thumbBlob?: unknown;
}

interface AtpAgentLike {
  com: {
    atproto: {
      repo: {
        createRecord: (params: {
          repo: string;
          collection: string;
          record: Record<string, unknown>;
        }) => Promise<{ data: { uri: string; cid: string } }>;
      };
    };
  };
}

/**
 * Creates an app.bsky.feed.post with an app.bsky.embed.external embed
 * containing associatedRefs linking to the site.standard.document and
 * site.standard.publication records. This produces the rich Bluesky
 * link card for standard.site content.
 *
 * Returns a StrongRef { uri, cid } pointing to the created post, suitable
 * for writing as bskyPostRef on the site.standard.document record.
 */
export async function crossPostToBluesky(
  agent: AtpAgentLike,
  params: CrossPostParams,
): Promise<StrongRef> {
  const {
    did,
    documentUri,
    documentCid,
    publicationUri,
    publicationCid,
    canonicalUrl,
    title,
    text,
    description,
    thumbBlob,
  } = params;

  const external: Record<string, unknown> = {
    uri: canonicalUrl,
    title,
    description: description ?? "",
    associatedRefs: [
      { $type: "com.atproto.repo.strongRef", uri: documentUri, cid: documentCid },
      { $type: "com.atproto.repo.strongRef", uri: publicationUri, cid: publicationCid },
    ],
  };

  if (thumbBlob !== undefined) {
    external.thumb = thumbBlob;
  }

  const result = await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: "app.bsky.feed.post",
    record: {
      $type: "app.bsky.feed.post",
      text,
      embed: {
        $type: "app.bsky.embed.external",
        external,
      },
      createdAt: new Date().toISOString(),
    },
  });

  return { uri: result.data.uri, cid: result.data.cid };
}
