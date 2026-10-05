// Runs before first paint (blocking <script> in root.tsx). Applies the
// visitor's saved theme, or their OS preference on a first visit. Light is
// the CSS default, so only "dark" needs the attribute. Storage can throw
// (private mode, blocked site data); fall back to the OS preference.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem("theme");
  } catch (e) {}
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  document.documentElement.setAttribute("data-theme", theme);
})();
