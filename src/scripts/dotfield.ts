/**
 * 指针反应点阵。
 *
 * 页面的"环境光"：点被指针推开、随后缓慢弹回，静止时回到平静。
 * 刻意不做粒子、不做连线爆炸——它的存在感要低于阅读本身。
 *
 * 这是整站唯一有一定分量的脚本，因此：
 * 1. 只在「精细指针 + 可悬停 + 允许动效」时动态加载，触屏用户完全不下载；
 * 2. 全部静止后停掉 requestAnimationFrame，不再占用主线程。
 */

type Dot = {
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  settled?: boolean;
};

const GAP = 34;
const RADIUS = 190;
const PUSH = 26;
const DAMPING = 0.86;
const SPRING = 0.022;

export function initDotField(canvas: HTMLCanvasElement, glow: HTMLElement) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const g2d: CanvasRenderingContext2D = ctx;
  const cv: HTMLCanvasElement = canvas;

  let width = 0;
  let height = 0;
  let dots: Dot[] = [];
  let raf = 0;
  let running = true;
  let inView = true;
  let idle = false;

  const pointer = { x: -9999, y: -9999, active: false };
  const smooth = { x: 0, y: 0, ready: false };
  let rect = { left: 0, top: 0, width: 0, height: 0 };

  let dotColor = "rgba(174,65,4,0.55)";
  let lineColor = "rgba(174,65,4,0.09)";
  let glowColor = "rgba(200,130,60,0.11)";
  let colorSupported = true;

  function probeColorSupport() {
    try {
      colorSupported =
        typeof CSS !== "undefined" &&
        typeof CSS.supports === "function" &&
        CSS.supports("color", "oklch(0.5 0.1 250)");
    } catch {
      colorSupported = false;
    }
  }

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const pick = (name: string, fallback: string) =>
      cs.getPropertyValue(name).trim() || fallback;

    if (colorSupported) {
      dotColor = pick("--pointer-dot", dotColor);
      lineColor = pick("--pointer-line", lineColor);
      glowColor = pick("--pointer-glow", glowColor);
    } else {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      dotColor = dark ? "rgba(244,127,70,0.5)" : "rgba(174,65,4,0.55)";
      lineColor = dark ? "rgba(244,127,70,0.1)" : "rgba(174,65,4,0.09)";
      glowColor = dark ? "rgba(255,180,120,0.14)" : "rgba(200,130,60,0.11)";
    }

    glow.style.background = `radial-gradient(circle closest-side, ${glowColor}, transparent 70%)`;
  }

  function build() {
    const r = cv.getBoundingClientRect();
    width = Math.max(1, Math.round(r.width));
    height = Math.max(1, Math.round(r.height));
    rect = { left: r.left, top: r.top, width, height };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.floor(width * dpr);
    cv.height = Math.floor(height * dpr);
    g2d.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cols = Math.ceil(width / GAP) + 1;
    const rows = Math.ceil(height / GAP) + 1;
    const offsetX = (width - (cols - 1) * GAP) / 2;
    const offsetY = (height - (rows - 1) * GAP) / 2;

    dots = new Array(cols * rows);
    let i = 0;
    for (let r2 = 0; r2 < rows; r2++) {
      for (let c = 0; c < cols; c++) {
        const hx = offsetX + c * GAP;
        const hy = offsetY + r2 * GAP;
        dots[i++] = { hx, hy, x: hx, y: hy, vx: 0, vy: 0 };
      }
    }
  }

  function syncRect() {
    const r = cv.getBoundingClientRect();
    rect.left = r.left;
    rect.top = r.top;
  }

  function frame() {
    if (!running) return;
    g2d.clearRect(0, 0, width, height);

    if (pointer.active && smooth.ready) {
      smooth.x += (pointer.x - smooth.x) * 0.12;
      smooth.y += (pointer.y - smooth.y) * 0.12;
      glow.style.transform = `translate3d(${smooth.x}px, ${smooth.y}px, 0)`;
      glow.style.opacity = "1";
    }

    const r2 = RADIUS * RADIUS;
    const near = RADIUS * 0.62;
    const near2 = near * near;

    let anythingMoving = pointer.active;

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];

      if (pointer.active) {
        const dx = d.x - pointer.x;
        const dy = d.y - pointer.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < r2 && dist2 > 0.01) {
          const dist = Math.sqrt(dist2);
          const falloff = 1 - dist / RADIUS;
          const impulse = falloff * falloff * falloff * PUSH * 0.16;
          d.vx += (dx / dist) * impulse;
          d.vy += (dy / dist) * impulse;
        }
      }

      d.vx += (d.hx - d.x) * SPRING;
      d.vy += (d.hy - d.y) * SPRING;
      d.vx *= DAMPING;
      d.vy *= DAMPING;
      d.x += d.vx;
      d.y += d.vy;

      if (
        Math.abs(d.x - d.hx) < 0.05 &&
        Math.abs(d.y - d.hy) < 0.05 &&
        Math.abs(d.vx) < 0.05 &&
        Math.abs(d.vy) < 0.05
      ) {
        d.x = d.hx;
        d.y = d.hy;
        d.vx = 0;
        d.vy = 0;
        d.settled = true;
      } else {
        d.settled = false;
        anythingMoving = true;
      }
    }

    g2d.fillStyle = dotColor;
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      if (d.settled) {
        g2d.globalAlpha = 0.28;
        g2d.fillRect(d.hx - 0.75, d.hy - 0.75, 1.5, 1.5);
        continue;
      }
      const dx = d.x - d.hx;
      const dy = d.y - d.hy;
      const disp = Math.min(Math.sqrt(dx * dx + dy * dy) / 22, 1);
      g2d.globalAlpha = 0.28 + disp * 0.72;
      const s = 1.5 + disp * 2;
      g2d.fillRect(d.x - s * 0.5, d.y - s * 0.5, s, s);
    }
    g2d.globalAlpha = 1;

    if (pointer.active) {
      g2d.strokeStyle = lineColor;
      g2d.lineWidth = 1;
      g2d.beginPath();
      let drew = false;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const dx = d.x - pointer.x;
        const dy = d.y - pointer.y;
        if (dx * dx + dy * dy < near2) {
          g2d.moveTo(pointer.x, pointer.y);
          g2d.lineTo(d.x, d.y);
          drew = true;
        }
      }
      if (drew) {
        g2d.globalAlpha = 0.5;
        g2d.stroke();
        g2d.globalAlpha = 1;
      }
    }

    // 全部停稳且指针不在画布上时停掉循环，这个点阵是装饰，不该常驻
    if (!anythingMoving && !pointer.active) {
      idle = true;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (!idle || !inView || document.hidden) return;
    idle = false;
    raf = requestAnimationFrame(frame);
  }

  function onPointerMove(e: PointerEvent) {
    if (e.pointerType !== "mouse") return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointer.x = x;
    pointer.y = y;
    wake();
    if (!pointer.active) {
      pointer.active = true;
      smooth.x = x;
      smooth.y = y;
      smooth.ready = true;
    }
  }

  function onPointerOut() {
    pointer.active = false;
    pointer.x = -9999;
    pointer.y = -9999;
    smooth.ready = false;
    glow.style.opacity = "0";
  }

  function syncRunState() {
    const shouldRun = inView && !document.hidden;
    if (shouldRun && !running) {
      running = true;
      idle = false;
      raf = requestAnimationFrame(frame);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      syncRunState();
    },
    { threshold: 0 }
  );
  io.observe(cv);

  let resizeTimer: number | undefined;
  function scheduleRebuild() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      build();
      readColors();
      // 重建后必须醒来重画一次，否则静止状态下会留下空白画布
      wake();
    }, 160);
  }

  // 盯容器自身，而不只是 window。
  // 标题字体加载完会重新换行、hero 高度随之变化，这类改变不触发 window.resize，
  // 只监听 window 会让画布位图比容器高一截（实测差 70px 左右）。
  const ro = new ResizeObserver(scheduleRebuild);
  ro.observe(cv);

  let scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      syncRect();
      scrollTicking = false;
    });
  }

  new MutationObserver(() => {
    readColors();
    wake();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  probeColorSupport();
  readColors();
  build();
  raf = requestAnimationFrame(frame);

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerout", onPointerOut);
  window.addEventListener("blur", onPointerOut);
  window.addEventListener("resize", scheduleRebuild);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", syncRunState);
}
