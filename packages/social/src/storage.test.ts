import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isRecommended,
  markRecommended,
  isSubscribed,
  markSubscribed,
  clearSubscribed,
} from "./storage.js";

beforeEach(() => localStorage.clear());

describe("recommended state", () => {
  it("is false until marked recommended", () => {
    expect(isRecommended("at://doc/1")).toBe(false);
    markRecommended("at://doc/1");
    expect(isRecommended("at://doc/1")).toBe(true);
  });

  it("keys are scoped per documentUri", () => {
    markRecommended("at://doc/1");
    expect(isRecommended("at://doc/2")).toBe(false);
  });
});

describe("subscribed state", () => {
  it("is false until marked subscribed, and clears back to false", () => {
    expect(isSubscribed("at://pub/1")).toBe(false);
    markSubscribed("at://pub/1");
    expect(isSubscribed("at://pub/1")).toBe(true);
    clearSubscribed("at://pub/1");
    expect(isSubscribed("at://pub/1")).toBe(false);
  });

  it("keys are scoped per publicationUri", () => {
    markSubscribed("at://pub/1");
    expect(isSubscribed("at://pub/2")).toBe(false);
  });
});

describe("localStorage unavailable (SSR, private browsing quota, etc.)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("isRecommended/isSubscribed fall back to false when getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(isRecommended("at://doc/1")).toBe(false);
    expect(isSubscribed("at://pub/1")).toBe(false);
  });

  it("markRecommended/markSubscribed swallow a throwing setItem instead of throwing", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => markRecommended("at://doc/1")).not.toThrow();
    expect(() => markSubscribed("at://pub/1")).not.toThrow();
  });

  it("clearSubscribed swallows a throwing removeItem instead of throwing", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(() => clearSubscribed("at://pub/1")).not.toThrow();
  });
});
