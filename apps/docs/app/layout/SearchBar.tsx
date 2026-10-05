import styles from "./SearchBar.module.css";

// Placeholder with the Omnibar's look (skyscribe-app's Omnibar.module.css
// .bar / .input / .keycap). The real search (an index of titles, headings
// and API names built at build time, ADR 0003) replaces this in a later
// step.
export default function SearchBar() {
  return (
    <div className={styles.bar}>
      <input
        type="search"
        className={styles.input}
        placeholder="Search the docs (coming soon)"
        aria-label="Search the docs"
        disabled
      />
      <span className={styles.keycap} aria-hidden="true">
        /
      </span>
    </div>
  );
}
