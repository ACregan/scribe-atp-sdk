import { describe, it, expect } from "vitest";
import * as social from "./index.js";

// Guards the public API: clearSubscribed existed but was missing from the
// package entry, so consumers couldn't clear a saved subscription.
describe("@skyscribe-sdk/social exports", () => {
  it("exports every storage helper", () => {
    for (const name of [
      "isRecommended",
      "markRecommended",
      "isSubscribed",
      "markSubscribed",
      "clearSubscribed",
    ] as const) {
      expect(typeof social[name]).toBe("function");
    }
  });
});
