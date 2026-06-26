import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LikeButton } from "./LikeButton.js";

const DOC_URI = "at://did:plc:abc/site.standard.document/test-post";
const SERVICE_URL = "https://social.scribe-atp.app";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("open", vi.fn().mockReturnValue(null));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LikeButton", () => {
  it("renders 'Like' when document has not been liked", () => {
    render(<LikeButton documentUri={DOC_URI} title="Test Post" />);
    expect(screen.getByRole("button", { name: "Like this article" })).toBeInTheDocument();
    expect(screen.getByText("Like")).toBeInTheDocument();
  });

  it("renders 'Liked ✓' and is disabled when localStorage indicates already liked", () => {
    localStorage.setItem(`scribe:recommended:${DOC_URI}`, "1");
    render(<LikeButton documentUri={DOC_URI} title="Test Post" />);
    const btn = screen.getByRole("button", { name: "Liked" });
    expect(btn).toBeDisabled();
    expect(screen.getByText("Liked ✓")).toBeInTheDocument();
  });

  it("opens the popup on click", () => {
    render(<LikeButton documentUri={DOC_URI} title="Test Post" serviceUrl={SERVICE_URL} />);
    fireEvent.click(screen.getByRole("button"));
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("/recommend?"),
      "scribe-social",
      expect.any(String)
    );
  });

  it("popup URL includes document, origin, and title params", () => {
    render(<LikeButton documentUri={DOC_URI} title="My Article" serviceUrl={SERVICE_URL} />);
    fireEvent.click(screen.getByRole("button"));
    const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    const params = new URL(url).searchParams;
    expect(params.get("document")).toBe(DOC_URI);
    expect(params.get("title")).toBe("My Article");
    expect(params.get("origin")).toBe(window.location.origin);
  });

  it("does not open a popup when already liked", () => {
    localStorage.setItem(`scribe:recommended:${DOC_URI}`, "1");
    render(<LikeButton documentUri={DOC_URI} title="Test Post" />);
    fireEvent.click(screen.getByRole("button"));
    expect(window.open).not.toHaveBeenCalled();
  });

  it("sets liked state and updates localStorage on valid postMessage", async () => {
    render(<LikeButton documentUri={DOC_URI} title="Test Post" serviceUrl={SERVICE_URL} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: SERVICE_URL,
          data: { ok: true, action: "recommend" },
        })
      );
    });

    expect(screen.getByRole("button", { name: "Liked" })).toBeDisabled();
    expect(localStorage.getItem(`scribe:recommended:${DOC_URI}`)).toBe("1");
  });

  it("ignores postMessages from a different origin", async () => {
    render(<LikeButton documentUri={DOC_URI} title="Test Post" serviceUrl={SERVICE_URL} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://evil.example.com",
          data: { ok: true, action: "recommend" },
        })
      );
    });

    expect(screen.getByRole("button", { name: "Like this article" })).not.toBeDisabled();
  });

  it("ignores postMessages with wrong action", async () => {
    render(<LikeButton documentUri={DOC_URI} title="Test Post" serviceUrl={SERVICE_URL} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: SERVICE_URL,
          data: { ok: true, action: "subscribe" },
        })
      );
    });

    expect(screen.getByRole("button", { name: "Like this article" })).not.toBeDisabled();
  });
});
