import { describe, it, expect } from "vitest";
import { matchScore, SCORE } from "./matcher";

describe("matchScore", () => {
  it("scores a whole-string prefix highest", () => {
    expect(matchScore("zer", ["Zero Likes"])).toBe(SCORE.stringPrefix);
  });

  it("scores a word-start prefix in the middle of the string", () => {
    expect(matchScore("lik", ["Zero Likes"])).toBe(SCORE.wordPrefix);
  });

  it("scores a bare substring lowest", () => {
    expect(matchScore("ike", ["Zero Likes"])).toBe(SCORE.substring);
  });

  it("returns null when nothing matches", () => {
    expect(matchScore("xyz", ["Zero Likes"])).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(matchScore("ZERO", ["zero likes"])).toBe(SCORE.stringPrefix);
  });

  it("matches across multiple fields, taking the best", () => {
    expect(matchScore("blog", ["Zero Likes", "zerolikes.blog"])).toBe(
      SCORE.wordPrefix,
    );
  });

  it("requires every whitespace-split term to match (AND)", () => {
    // "zero" is a whole-string prefix, "likes" only a word-start prefix —
    // the weakest term wins, so the row scores wordPrefix.
    expect(matchScore("zero likes", ["Zero Likes"])).toBe(SCORE.wordPrefix);
    expect(matchScore("zero missing", ["Zero Likes"])).toBeNull();
  });

  it("takes the weakest term's score as the row score", () => {
    // "zero" is a string-prefix, "ike" only a substring -> weakest wins
    expect(matchScore("zero ike", ["Zero Likes"])).toBe(SCORE.substring);
  });

  it("splits words on punctuation for word-prefix matching", () => {
    expect(matchScore("guide", ["build-your-own-frontend/user-guide"])).toBe(
      SCORE.wordPrefix,
    );
  });
});
