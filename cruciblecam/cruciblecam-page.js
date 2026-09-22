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
    const lightbox = document.querySelector(".lightbox");
    const lightboxImage = lightbox?.querySelector(".lightbox-image");
    const closeLightbox = () => {
      if (!lightbox || !lightboxImage) return;
      lightbox.hidden = true;
      lightbox.setAttribute("aria-hidden", "true");
      lightboxImage.removeAttribute("src");
      lightboxImage.alt = "";
      document.body.classList.remove("lightbox-open");
    };

    document.querySelectorAll("button[data-lang-url]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.langUrl) window.location.href = button.dataset.langUrl;
      });
    });

    document.querySelectorAll("button[data-theme]").forEach((button) => {
      button.addEventListener("click", () => applyTheme(button.dataset.theme));
    });

    document.querySelectorAll("[data-screenshot]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!lightbox || !lightboxImage) return;
        const image = button.querySelector("img");
        lightboxImage.src = button.dataset.screenshot;
        lightboxImage.alt = image?.alt || "";
        lightbox.hidden = false;
        lightbox.setAttribute("aria-hidden", "false");
        document.body.classList.add("lightbox-open");
      });
    });

    lightbox?.querySelectorAll("[data-lightbox-close], .lightbox-close").forEach((element) => {
      element.addEventListener("click", closeLightbox);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox();
    });

    document.querySelectorAll("[data-analytics-download]").forEach((link) => {
      link.addEventListener("click", () => {
        if (typeof window.gtag !== "function") return;
        window.gtag("event", "cruciblecam_download_click", {
          download_file_name: "CrucibleCam_x64-setup.zip",
          download_url: new URL(link.getAttribute("href"), window.location.href).href,
          page_language: document.documentElement.lang
        });
      });
    });

    applyTheme(localStorage.getItem(themeStorageKey) || "light");
    syncHeaderHeight();
    window.addEventListener("resize", syncHeaderHeight);

    const header = document.querySelector(".site-header");
    if (header && "ResizeObserver" in window) new ResizeObserver(syncHeaderHeight).observe(header);
  });
})();
