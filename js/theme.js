(() => {
  const storageKey = "freshnklean-theme";
  let savedTheme = "light";
  try {
    savedTheme = window.localStorage.getItem(storageKey) || "light";
  } catch (error) {
    console.warn("Theme preference could not be loaded:", error);
  }
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
    button.classList.toggle("is-dark", isDark);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll("[data-theme-toggle]");
    buttons.forEach(button => {
      updateToggle(button, document.documentElement.dataset.theme);
      button.addEventListener("click", () => {
        const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = theme;
        try {
          window.localStorage.setItem(storageKey, theme);
        } catch (error) {
          console.warn("Theme preference could not be saved:", error);
        }
        if (themeColor) themeColor.content = theme === "dark" ? "#181620" : "#f8f7fb";
        buttons.forEach(toggle => updateToggle(toggle, theme));
        document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
      });
    });

    window.addEventListener("storage", event => {
      if (event.key !== storageKey || (event.newValue !== "dark" && event.newValue !== "light")) return;
      document.documentElement.dataset.theme = event.newValue;
      if (themeColor) themeColor.content = event.newValue === "dark" ? "#181620" : "#f8f7fb";
      buttons.forEach(button => updateToggle(button, event.newValue));
      document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: event.newValue } }));
    });
  });
})();
