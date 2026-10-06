"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * 主题切换。
 *
 * 真实状态由 layout 里的阻塞脚本在首帧前写进 <html data-theme>，
 * 这里不维护独立的 React 状态，而是把 DOM 属性当作唯一数据源订阅它——
 * 这样服务端与客户端的首次渲染结果一致（都是 "light"），
 * 挂载后再切到真实值，既不产生水合不一致，也不会在 effect 里同步 setState。
 */

const EVENT = "themechange";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  // 系统主题变化也要反映到按钮图标上
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    mq.removeEventListener("change", onChange);
  };
}

function readTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

/** 服务端不知道用户偏好，先按亮色渲染，避免闪烁与不一致。 */
const getServerTheme = (): "light" | "dark" => "light";

function applyTheme(next: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", next);
  document.documentElement.style.colorScheme = next;
  window.dispatchEvent(new Event(EVENT));
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerTheme);
  const isDark = theme === "dark";

  // 跟随系统：用户没手动选过时，系统主题变化应当同步到 DOM。
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem("theme");
      } catch {
        /* 隐私模式下 localStorage 可能抛错，忽略即可 */
      }
      if (stored === "light" || stored === "dark") return;
      applyTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* 忽略写入失败 */
    }
  }, [isDark]);

  const label = isDark ? "切换到亮色主题" : "切换到暗色主题";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          {isDark ? (
            <path
              d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          ) : (
            <>
              <circle
                cx="12"
                cy="12"
                r="4.2"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M12 2.8v2.1M12 19.1v2.1M21.2 12h-2.1M4.9 12H2.8M18.5 5.5l-1.5 1.5M7 17l-1.5 1.5M18.5 18.5 17 17M7 7 5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
      </span>
    </button>
  );
}
