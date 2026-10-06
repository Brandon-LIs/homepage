"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { SITE } from "@/data/site";

const NAV = [
  { href: "/#about", label: "关于" },
  { href: "/#work", label: "项目" },
  { href: "/#writing", label: "博客" },
  { href: "/#contact", label: "联系" },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 移动端菜单：Esc 关闭 + 打开时锁定滚动
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="site-header" data-scrolled={scrolled || undefined}>
      <div className="site-header__inner container">
        {/* 不加 aria-label：可见文字是「Brandon」，若另起一个含「首页」的
            accessible name，两者不一致会触发 WCAG 2.5.3 语音输入失败。 */}
        <Link href="/" className="brand">
          <span className="brand__mark" aria-hidden="true">
            B
          </span>
          <span className="brand__name">{SITE.name}</span>
        </Link>

        <nav className="site-nav" aria-label="主导航">
          <ul className="site-nav__list">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="site-nav__link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <a
            className="site-header__blog"
            href={SITE.blog}
            rel="noopener"
            target="_blank"
          >
            博客
            <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
              <path
                d="M3.5 8.5 8.5 3.5M4.8 3.5h3.7v3.7"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </a>
          <ThemeToggle />
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "关闭菜单" : "打开菜单"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="nav-toggle__bars" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        ref={panelRef}
        className="mobile-nav"
        data-open={open || undefined}
        hidden={!open}
      >
        <ul className="mobile-nav__list">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="mobile-nav__link"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              className="mobile-nav__link mobile-nav__link--ext"
              href={SITE.blog}
              rel="noopener"
              target="_blank"
              onClick={() => setOpen(false)}
            >
              博客 {SITE.blog.replace(/^https?:\/\//, "")} ↗
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
