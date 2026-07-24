import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withRetry } from "./retry.js";
import { NotFoundError, PdsFetchError } from "./errors.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

async function runWithFakeTimers<T>(promise: Promise<T>): Promise<T> {
  const result = promise;
  await vi.runAllTimersAsync();
  return result;
}

describe("withRetry", () => {
  it("returns the value on first success without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await runWithFakeTimers(withRetry(fn));
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds within the attempt budget", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new PdsFetchError("boom"))
      .mockRejectedValueOnce(new PdsFetchError("boom"))
      .mockResolvedValueOnce("ok");

    const result = await runWithFakeTimers(withRetry(fn));
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("gives up after the configured number of attempts and throws the last error", async () => {
    const fn = vi.fn().mockRejectedValue(new PdsFetchError("always fails"));

    const promise = withRetry(fn, { attempts: 3, delaysMs: [1, 1] });
    const assertion = expect(promise).rejects.toThrow("always fails");
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry NotFoundError", async () => {
    const fn = vi.fn().mockRejectedValue(new NotFoundError("Article not found: x"));

    const promise = withRetry(fn);
    const assertion = expect(promise).rejects.toBeInstanceOf(NotFoundError);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries plain Errors from callers not using the typed errors", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("generic failure"))
      .mockResolvedValueOnce("ok");

    const result = await runWithFakeTimers(withRetry(fn));
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("stops retrying and rejects immediately once the signal is aborted", async () => {
    const controller = new AbortController();
    const fn = vi.fn().mockImplementation(async () => {
      throw new PdsFetchError("boom");
    });

    const promise = withRetry(fn, { signal: controller.signal, delaysMs: [1000] });
    const assertion = expect(promise).rejects.toMatchObject({ name: "AbortError" });
    // let the first attempt fail and start waiting on the backoff
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await vi.runAllTimersAsync();

    await assertion;
  });

  it("respects a custom attempts/delaysMs configuration", async () => {
    const fn = vi.fn().mockRejectedValue(new PdsFetchError("boom"));

    const promise = withRetry(fn, { attempts: 2, delaysMs: [5] });
    const assertion = expect(promise).rejects.toThrow("boom");
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
