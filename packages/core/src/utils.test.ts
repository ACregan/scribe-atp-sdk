import { describe, it, expect } from "vitest";
import { toSlug, slugFromUri, flattenArticles } from "./utils.js";

describe("toSlug", () => {
  it("replaces dots with hyphens", () => {
    expect(toSlug("norobots.blog")).toBe("norobots-blog");
  });

  it("strips non-alphanumeric characters other than hyphens", () => {
    expect(toSlug("my_site.co.uk")).toBe("mysite-co-uk");
  });

  it("handles a domain with no dots", () => {
    expect(toSlug("localhost")).toBe("localhost");
  });
});

describe("slugFromUri", () => {
  it("returns the last segment of an AT URI", () => {
    expect(slugFromUri("at://did:plc:abc/app.scribe.article/my-post")).toBe(
      "my-post"
    );
  });

  it("returns empty string for an empty URI", () => {
    expect(slugFromUri("")).toBe("");
  });
});

describe("flattenArticles", () => {
  it("combines articles from all groups into a single array", () => {
    const groups = [
      {
        articles: [
          { uri: "at://1", title: "A", splashImageUrl: null, createdAt: "" },
        ],
      },
      {
        articles: [
          { uri: "at://2", title: "B", splashImageUrl: null, createdAt: "" },
        ],
      },
    ];
    const result = flattenArticles(groups);
    expect(result).toHaveLength(2);
    expect(result[0].uri).toBe("at://1");
    expect(result[1].uri).toBe("at://2");
  });

  it("returns an empty array when there are no groups", () => {
    expect(flattenArticles([])).toEqual([]);
  });
});
