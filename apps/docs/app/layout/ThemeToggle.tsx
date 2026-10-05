import { useEffect, useState } from "react";
import SvgIcon, { SvgImageList } from "~/components/SvgIcon";
import styles from "./DocsLayout.module.css";

type Theme = "light" | "dark";

// /theme-init.js has already applied the saved (or OS) theme to <html>
// before hydration; this reads it back and lets the visitor flip it. The
// choice lives in localStorage only: per visitor, nothing sent anywhere.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light",
    );
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage blocked: the theme still changes for this page view.
    }
    setTheme(next);
  }

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={toggle}
      aria-label={label}
      title={label}
      // Unknown until hydration; avoid showing the wrong icon.
      style={theme === null ? { visibility: "hidden" } : undefined}
    >
      <SvgIcon
        name={theme === "dark" ? SvgImageList.LightMode : SvgImageList.DarkMode}
        fill="var(--text-primary)"
      />
    </button>
  );
}
