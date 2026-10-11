/** Light / dark theme. The initial value is applied by public/theme-init.js before first paint. */
import { icon } from "./dom.js";

const KEY = "attendance-theme";

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function currentTheme() {
  return document.documentElement.dataset.theme || systemTheme();
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = document.getElementById("themeToggle");
  btn.replaceChildren(icon(theme === "dark" ? "sun" : "moon"));
  btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  const color = theme === "dark" ? "#12110d" : "#f7f4ed";
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", color));
}

export function initTheme() {
  apply(currentTheme());
  document.getElementById("themeToggle").addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable (private mode): the choice lasts for this visit only */
    }
  });
  // Follow the device setting until the person makes their own choice.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    try {
      if (!localStorage.getItem(KEY)) apply(systemTheme());
    } catch {
      apply(systemTheme());
    }
  });
}
