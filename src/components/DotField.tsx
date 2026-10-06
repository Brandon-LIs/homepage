"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

type Dot = {
  /** 静止位置（相对 canvas） */
  hx: number;
  hy: number;
  /** 当前位置 */
  x: number;
  y: number;
  /** 速度 */
  vx: number;
  vy: number;
  /** 已经完全静止，绘制时可以走快速路径 */
  settled?: boolean;
};

/** 网格间距（CSS 像素）。越大点越稀疏、开销越低。 */
const GAP = 34;
/** 指针影响半径（CSS 像素）。 */
const RADIUS = 190;
/** 排斥冲量强度 */
const PUSH = 26;
/** 阻尼：越大越"黏"，越小回弹越软 */
const DAMPING = 0.86;
/** 弹簧系数：点归位的力量 */
const SPRING = 0.022;

/** 是否具备运行指针层的环境：桌面精细指针 + 可悬停 + 允许动效。 */
function canRunPointerField(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return (
    window.matchMedia("(pointer: fine)").matches &&
    window.matchMedia("(hover: hover)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** 这些媒体查询在会话期间不会变化，订阅函数因此是空操作。 */
function subscribeToNothing() {
  return () => {};
}

const getServerEnabled = () => false;

/**
 * 指针反应点阵。
 *
 * 这是页面的"环境光"：点阵被指针推开、随后缓慢弹回，静止时回到平静。
 * 刻意不做粒子、不做连线爆炸——它的存在感必须低于阅读本身。
 *
 * 只在「精细指针 + 可悬停 + 允许动效」时挂载；触屏与降级环境不渲染
 * canvas，因此移动端完全不解析、不执行这段代码。
 */
export default function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  // 环境能力在客户端是常量，用 useSyncExternalStore 读取：
  // 服务端快照为 false（不渲染 canvas），客户端按实际能力取值，
  // 既不产生水合不一致，也不必在 effect 里同步 setState。
  const enabled = useSyncExternalStore(
    subscribeToNothing,
    canRunPointerField,
    getServerEnabled
  );

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    const glow = glowRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // 上面两个守卫之后，下面全是 hoisted 的 function 声明。
    // 函数声明会被提升，TS 不会把守卫处的收窄带进它们的作用域，
    // 因此这里用显式非空类型的 const 别名固定下来。
    const cv: HTMLCanvasElement = canvas;
    const g2d: CanvasRenderingContext2D = ctx;

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let dots: Dot[] = [];
    let raf = 0;
    let running = true;
    let inView = true;
    /** 静止后循环会停下，靠指针事件唤醒 */
    let idle = false;

    const pointer = { x: -9999, y: -9999, active: false };
    /** 滞后跟随的指针位置，让光晕有重量感 */
    const smooth = { x: 0, y: 0, ready: false };
    /** canvas 在视口中的位置，用于把 clientX/Y 换算成 canvas 坐标 */
    let rect = { left: 0, top: 0, width: 0, height: 0 };

    let dotColor = "rgba(43,92,240,0.5)";
    let lineColor = "rgba(43,92,240,0.08)";
    let glowColor = "rgba(90,170,220,0.14)";
    let colorSupported = true;

    /** 探针：老浏览器不支持在 canvas 里解析 oklch()，此时退回 rgba。 */
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

    /**
     * 从 CSS 自定义属性读取当前主题的颜色，让 Canvas 与两套主题保持一致，
     * 而不是在 JS 里硬编码色值。
     */
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
        dotColor = dark ? "rgba(122,160,255,0.55)" : "rgba(43,92,240,0.5)";
        lineColor = dark ? "rgba(122,160,255,0.1)" : "rgba(43,92,240,0.08)";
        glowColor = dark ? "rgba(140,205,255,0.16)" : "rgba(90,170,220,0.14)";
      }

      if (glow) {
        glow.style.background = `radial-gradient(circle closest-side, ${glowColor}, transparent 70%)`;
      }
    }

    /** 重新测量 canvas 并重建点阵 */
    function build() {
      const r = cv.getBoundingClientRect();
      // canvas 由 inset:0 决定尺寸，取整避免半像素模糊
      width = Math.max(1, Math.round(r.width));
      height = Math.max(1, Math.round(r.height));
      rect = { left: r.left, top: r.top, width, height };

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.floor(width * dpr);
      cv.height = Math.floor(height * dpr);
      g2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 网格从中心对称展开，避免右侧/底部留下半格残边
      cols = Math.ceil(width / GAP) + 1;
      rows = Math.ceil(height / GAP) + 1;
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

    /** 只刷新位置缓存，不重建点阵（滚动时用） */
    function syncRect() {
      const r = cv.getBoundingClientRect();
      rect.left = r.left;
      rect.top = r.top;
    }

    function frame() {
      if (!running) return;
      g2d.clearRect(0, 0, width, height);

      // 光晕滞后跟随，移动因此更有重量
      if (pointer.active && smooth.ready) {
        smooth.x += (pointer.x - smooth.x) * 0.12;
        smooth.y += (pointer.y - smooth.y) * 0.12;
        if (glow) {
          glow.style.transform = `translate3d(${smooth.x}px, ${smooth.y}px, 0)`;
          glow.style.opacity = "1";
        }
      }

      const r2 = RADIUS * RADIUS;
      const near = RADIUS * 0.62;
      const near2 = near * near;

      // --- 物理积分 ---
      // anythingMoving 用来判断这一帧之后能否彻底停下渲染循环
      let anythingMoving = pointer.active;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        if (pointer.active) {
          const dx = d.x - pointer.x;
          const dy = d.y - pointer.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < r2 && dist2 > 0.01) {
            const dist = Math.sqrt(dist2);
            // 三次方衰减：近处强推、远处几乎无感，避免整屏一起晃
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

        // 位移和速度都小到看不出来时，直接吸附回静止位。
        // 否则每次都要多画几百个几乎不动的点，也让循环永远停不下来。
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

      // --- 绘制点：位移量决定亮度与大小 ---
      g2d.fillStyle = dotColor;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        // 完全静止的点用固定的最暗值画，省掉一次浮点开方
        // 也保证静止时整屏看起来是均匀的底纹
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
        // 用 fillRect 代替 arc：这个尺寸下视觉等价，但快得多
        g2d.fillRect(d.x - s * 0.5, d.y - s * 0.5, s, s);
      }
      g2d.globalAlpha = 1;

      // --- 指针与近邻的细连线：暗示"场"的存在，克制到几乎看不见 ---
      if (pointer.active) {
        g2d.strokeStyle = lineColor;
        g2d.lineWidth = 1;
        g2d.beginPath();
        let drew = false;
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i];
          const dx = d.x - pointer.x;
          const dy = d.y - pointer.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < near2) {
            g2d.moveTo(pointer.x, pointer.y);
            g2d.lineTo(d.x, d.y);
            drew = true;
          }
        }
        if (drew) {
          // 一次性描边，比逐条 stroke 省一个数量级的调用
          g2d.globalAlpha = 0.5;
          g2d.stroke();
          g2d.globalAlpha = 1;
        }
      }

      // 全部停稳且指针不在画布上时，停掉渲染循环。
      // 这个点阵是背景装饰，静止时不该持续占用主线程。
      if (!anythingMoving && !pointer.active) {
        idle = true;
        return;
      }

      raf = requestAnimationFrame(frame);
    }

    /** 循环因静止停下后，由指针移动或重建点阵来唤醒。 */
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
      if (glow) glow.style.opacity = "0";
    }

    function syncRunState() {
      const shouldRun = inView && !document.hidden;
      if (shouldRun && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    }

    // 滚出视口就停掉渲染循环，滚到别处不该继续烧 CPU
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        syncRunState();
      },
      { threshold: 0 }
    );
    io.observe(cv);

    let resizeTimer: number | undefined;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        build();
        readColors();
        // 重建后必须醒来重画一次，否则静止状态下的点阵会留在空白画布上
        wake();
      }, 160);
    }

    // 滚动会让 canvas 在视口中的位置改变，必须同步，否则指针坐标会偏移
    let scrollTicking = false;
    function onScroll() {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        syncRect();
        scrollTicking = false;
      });
    }

    // 主题切换时重新取色并重画
    const mo = new MutationObserver(() => {
      readColors();
      wake();
    });
    mo.observe(document.documentElement, {
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
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", syncRunState);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", onPointerOut);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", syncRunState);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="dotfield" aria-hidden="true">
      <div ref={glowRef} className="dotfield__glow" />
      <canvas ref={canvasRef} className="dotfield__canvas" />
    </div>
  );
}
