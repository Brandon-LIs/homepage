/**
 * 主题切换、吸顶分隔线、移动端菜单。
 *
 * 都是几十行原生 DOM 操作。真正的主题值由 layout 里的阻塞脚本写入
 * <html data-theme>，这里只负责响应交互，不维护第二份状态。
 */

const root = document.documentElement;
const button = document.getElementById("theme-toggle");
const header = document.getElementById("site-header");
const navToggle = document.getElementById("nav-toggle");
const mobileNav = document.getElementById("mobile-nav");

const SUN = "切换到亮色主题";
const MOON = "切换到暗色主题";

function currentTheme(): "light" | "dark" {
  return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function applyTheme(next: "light" | "dark") {
  root.setAttribute("data-theme", next);
  root.style.colorScheme = next;
  if (button) {
    const label = next === "dark" ? SUN : MOON;
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  }
}

// 首次同步按钮文案（主题本身已在首帧前设定好）
if (button) {
  applyTheme(currentTheme());

  button.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* 隐私模式下写入可能失败，忽略即可 */
    }
  });
}

// 跟随系统：用户没手动选过时才跟随
const mq = window.matchMedia("(prefers-color-scheme: dark)");
mq.addEventListener("change", (e) => {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem("theme");
  } catch {
    /* 忽略 */
  }
  if (stored === "light" || stored === "dark") return;
  applyTheme(e.matches ? "dark" : "light");
});

// 滚动后给页头加一条分隔线
if (header) {
  const onScroll = () => {
    if (window.scrollY > 8) header.setAttribute("data-scrolled", "");
    else header.removeAttribute("data-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// 移动端菜单
if (navToggle && mobileNav) {
  const setOpen = (open: boolean) => {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    mobileNav.hidden = !open;
    mobileNav.toggleAttribute("data-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };

  navToggle.addEventListener("click", () => {
    setOpen(navToggle.getAttribute("aria-expanded") !== "true");
  });

  mobileNav.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      navToggle.focus();
    }
  });

  // 回到桌面宽度时收起，避免抽屉状态残留
  const desktop = window.matchMedia("(min-width: 901px)");
  desktop.addEventListener("change", (e) => {
    if (e.matches) setOpen(false);
  });
}

export {};
