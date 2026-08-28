(() => {
  const root = document.documentElement;
  const themeStorageKey = "lasme_theme";

  function syncHeaderHeight() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    root.style.setProperty("--header-h", `${Math.ceil(header.getBoundingClientRect().height)}px`);
  }

  function applyTheme(theme) {
    const selectedTheme = theme === "dark" ? "dark" : "light";
    root.setAttribute("data-theme", selectedTheme);
    localStorage.setItem(themeStorageKey, selectedTheme);

    document.querySelectorAll("button[data-theme]").forEach((button) => {
      const active = button.dataset.theme === selectedTheme;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("button[data-lang-url]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.langUrl) window.location.href = button.dataset.langUrl;
      });
    });

    document.querySelectorAll("button[data-theme]").forEach((button) => {
      button.addEventListener("click", () => applyTheme(button.dataset.theme));
    });

    applyTheme(localStorage.getItem(themeStorageKey) || "light");
    syncHeaderHeight();
    window.addEventListener("resize", syncHeaderHeight);

    const header = document.querySelector(".site-header");
    if (header && "ResizeObserver" in window) new ResizeObserver(syncHeaderHeight).observe(header);
  });
})();
