# @scribe-atp/styles

## 1.1.1

### Patch Changes

- Add README documenting installation, usage, theming, and the full custom property reference.

## 1.1.0

### Minor Changes

- Add `@scribe-atp/styles` — base CSS for rendering Scribe CMS content

  New package `@scribe-atp/styles` provides scoped styles for article content rendered via Scribe CMS. Import the stylesheet and wrap article HTML in an element with `class="scribe-content"`.

  Covers: code block syntax highlighting (Prism-compatible token classes), inline code, images, blockquotes, ordered/unordered lists with correct indentation, and checklists (using `aria-checked` attribute selectors). All colours are overridable via CSS custom properties (`--scribe-token-keyword`, `--scribe-code-bg`, etc.).

  Add `ScribeContent` component to `@scribe-atp/react` — a thin `<div>` wrapper that applies `scribe-content` class and renders HTML via `dangerouslySetInnerHTML`. Accepts all `<div>` HTML attributes; `className` is merged with `scribe-content`.
