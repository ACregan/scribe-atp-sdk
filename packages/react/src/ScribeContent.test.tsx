import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ScribeContent } from "./ScribeContent.js";

describe("ScribeContent", () => {
  it("renders the given HTML via dangerouslySetInnerHTML", () => {
    const { container } = render(<ScribeContent html="<p>Hello <strong>world</strong></p>" />);
    expect(container.querySelector("p")?.innerHTML).toBe("Hello <strong>world</strong>");
  });

  it("applies the scribe-content class with no className prop", () => {
    const { container } = render(<ScribeContent html="<p>Hi</p>" />);
    expect(container.firstElementChild?.className).toBe("scribe-content");
  });

  it("appends a custom className alongside scribe-content", () => {
    const { container } = render(<ScribeContent html="<p>Hi</p>" className="custom" />);
    expect(container.firstElementChild?.className).toBe("scribe-content custom");
  });

  it("forwards other HTML attributes to the wrapping div", () => {
    const { container } = render(<ScribeContent html="<p>Hi</p>" id="article-body" data-testid="content" />);
    const div = container.firstElementChild;
    expect(div?.getAttribute("id")).toBe("article-body");
    expect(div?.getAttribute("data-testid")).toBe("content");
  });
});
