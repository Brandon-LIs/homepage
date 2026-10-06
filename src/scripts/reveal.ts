/**
 * 滚动揭示。
 *
 * 关键约束：内容默认就是可见的。只有脚本正常运行时，CSS 里的
 * html.js .reveal 才会让它进入待揭示状态，因此爬虫、无 JS 环境、
 * 以及隐藏标签页渲染都不会拿到一块空白。
 */
export function initReveal() {
  const items = document.querySelectorAll<HTMLElement>(".reveal");
  if (!items.length) return;

  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (calm) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const vh = window.innerHeight;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );

  items.forEach((el) => {
    // 首屏内容直接呈现，不做等待触发的入场
    if (el.getBoundingClientRect().top < vh * 0.9) {
      el.classList.add("is-visible");
    } else {
      io.observe(el);
    }
  });
}
