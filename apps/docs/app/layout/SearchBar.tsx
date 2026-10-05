import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import SvgIcon, { SvgImageList } from "~/components/SvgIcon";
import type { SearchEntry } from "~/search/buildIndex";
import { MIN_QUERY_LENGTH, searchEntries } from "~/search/search";
import styles from "./SearchBar.module.css";

// The docs search, where skyscribe.app has its Omnibar (same look, same
// matcher). The index (titles, headings, API names; ADR 0003) is built at
// build time into /search-index.json and fetched on first use, so pages
// that never search never download it.

let indexPromise: Promise<SearchEntry[]> | null = null;

function loadIndex(): Promise<SearchEntry[]> {
  indexPromise ??= fetch("/search-index.json")
    .then((res) => {
      if (!res.ok) throw new Error(`search index: ${res.status}`);
      return res.json() as Promise<SearchEntry[]>;
    })
    .catch((err: unknown) => {
      indexPromise = null; // let the next focus retry
      throw err;
    });
  return indexPromise;
}

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || (el as HTMLElement).isContentEditable;
}

export default function SearchBar() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(
    () => (index ? searchEntries(index, query) : []),
    [index, query],
  );
  const showPanel = open && query.trim().length >= MIN_QUERY_LENGTH;

  function ensureIndex() {
    if (index) return;
    loadIndex()
      .then((data) => {
        setIndex(data);
        setLoadFailed(false);
      })
      .catch(() => setLoadFailed(true));
  }

  // "/" or Cmd/Ctrl+K focuses the search from anywhere, like the Omnibar.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isShortcut =
        (e.key === "/" && !isTypingTarget(document.activeElement)) ||
        (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey));
      if (!isShortcut) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(entry: SearchEntry) {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    navigate(entry.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      if (query) setQuery("");
      else inputRef.current?.blur();
      return;
    }
    if (!showPanel || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  }

  const optionId = (i: number) => `${listId}-option-${i}`;

  return (
    <div className={styles.root}>
      <div className={showPanel ? styles.bar_open : styles.bar}>
        <input
          ref={inputRef}
          type="search"
          className={styles.input}
          placeholder="Search the docs"
          aria-label="Search the docs"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showPanel && results.length > 0 ? optionId(active) : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => {
            ensureIndex();
            setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        <kbd className={styles.keycap} aria-hidden="true">
          /
        </kbd>
      </div>

      {showPanel && (
        <div className={styles.results}>
          {loadFailed ? (
            <p className={styles.message}>Search isn't available right now.</p>
          ) : !index ? (
            <p className={styles.message}>Loading…</p>
          ) : results.length === 0 ? (
            <p className={styles.message}>No results for “{query.trim()}”.</p>
          ) : (
            <ul id={listId} role="listbox" className={styles.list}>
              {results.map((entry, i) => (
                <li
                  key={entry.href}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? styles.row_active : styles.row}
                  // mousedown, not click: keeps the input from blurring
                  // (and the panel closing) before the click lands.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(entry);
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <SvgIcon
                    name={entry.kind === "page" ? SvgImageList.Document : SvgImageList.Link}
                    className={styles.icon}
                    fill="var(--text-primary)"
                  />
                  <span className={styles.primary}>{entry.title}</span>
                  <span className={styles.secondary}>{entry.context}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
