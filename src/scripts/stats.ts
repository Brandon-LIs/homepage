/**
 * 页脚访问统计（不蒜子）。
 *
 * 两个刻意的选择：
 *
 * 1. 懒加载。统计只是个页脚数字，不该占用首屏的带宽和主线程。
 *    页脚进入视口前不加载任何东西；真到了再注入脚本。
 *
 * 2. 用官方脚本而不是自己 fetch。计数逻辑（PV/UV 判定、身份令牌、
 *    去重）都在脚本里，自己实现容易把数据算歪。样式与加载时机由我们控制，
 *    计数交给它。
 *
 * 数字位在服务端已经渲染成占位符（—），脚本回填时原地替换文字，
 * 不改变元素尺寸以外的布局，因此不会产生明显的布局跳动。
 */

const SCRIPT_SRC = "https://jsd.dusays.com/npm/penndu@17.0.0/bsz.js";
const API = "https://bsz.dusays.com:9001/api";

export function initSiteStats() {
  const el = document.getElementById("site-stats");
  if (!el) return;

  // 非空别名：下面的回调是嵌套函数，TS 不会把外层的收窄带进去
  const box: HTMLElement = el;
  let loaded = false;

  /** 注入官方脚本。它自己会按 id 回填 busuanzi_site_pv / _site_uv。 */
  function load() {
    if (loaded) return;
    loaded = true;

    const s = document.createElement("script");
    s.defer = true;
    // 数据格式：过千加逗号更易读（例如 5,216）
    s.setAttribute("data-style", "comma");
    s.setAttribute("data-api", API);
    s.src = SCRIPT_SRC;
    s.onload = () => {
      // 脚本会把值写进元素；等它写完后把状态切到 ready
      const pv = document.getElementById("busuanzi_site_pv");
      const uv = document.getElementById("busuanzi_site_uv");
      const done = () => {
        if (
          pv && uv &&
          pv.textContent !== "—" && uv.textContent !== "—"
        ) {
          box.setAttribute("data-state", "ready");
          return true;
        }
        return false;
      };
      if (!done()) {
        // 脚本用 XHR 异步请求，结果不会同步就绪，轮询几次即可
        let tries = 0;
        const timer = window.setInterval(() => {
          if (done() || ++tries > 20) window.clearInterval(timer);
        }, 150);
      }
    };
    s.onerror = () => {
      // 统计服务不可用不该留一个尴尬的占位符，直接隐藏整块
      box.setAttribute("data-state", "failed");
    };
    document.head.appendChild(s);
  }

  // 页脚进入视口前 200px 就预加载，滚到底时数字已经就位
  if (!("IntersectionObserver" in window)) {
    load();
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          io.disconnect();
          load();
        }
      }
    },
    { rootMargin: "200px 0px" }
  );
  io.observe(box);
}
