(() => {
  const storageKey = "freshnklean-theme";
  const savedTheme = window.localStorage.getItem(storageKey);
  document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = savedTheme === "dark" ? "#181620" : "#f8f7fb";

  function updateToggle(button, theme) {
    const isDark = theme === "dark";
    button.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
    button.setAttribute("aria-pressed", String(isDark));
    button.title = `Switch to ${isDark ? "light" : "dark"} mode`;
    button.querySelector(".theme-toggle-icon").textContent = isDark ? "☀" : "☾";
    button.querySelector(".theme-toggle-label").textContent = isDark ? "Light mode" : "Dark mode";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll("[data-theme-toggle]");
    buttons.forEach(button => {
      updateToggle(button, document.documentElement.dataset.theme);
      button.addEventListener("click", () => {
        const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = theme;
        window.localStorage.setItem(storageKey, theme);
        if (themeColor) themeColor.content = theme === "dark" ? "#181620" : "#f8f7fb";
        buttons.forEach(toggle => updateToggle(toggle, theme));
        document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
      });
    });
  });
})();
