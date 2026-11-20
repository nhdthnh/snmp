/**
 * Quản lý giao diện sáng/tối + lưu tuỳ chọn người dùng (theme.js).
 */
export const prefs = {
  get(key, fallback) {
    try { return localStorage.getItem("netmon-" + key) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("netmon-" + key, value); } catch { /* bỏ qua */ }
  },
};

export const currentTheme = () =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  prefs.set("theme", theme);
  const btn = document.getElementById("theme-toggle-btn");
  if (btn) {
    btn.textContent = theme === "light" ? "🌙" : "☀️";
    btn.title = theme === "light" ? "Chuyển sang chế độ tối" : "Chuyển sang chế độ sáng";
  }
}

export function toggleTheme() {
  applyTheme(currentTheme() === "light" ? "dark" : "light");
}
