"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * 鼠标跟踪光球组件
 * 用途：渲染多个光球，根据鼠标位置产生视差偏移效果
 * 输入：无
 * 输出：包含多个光球的 JSX 元素
 * 副作用：监听鼠标移动事件，更新光球位置
 */
export default function MouseTrackingOrbs() {
  // 窗口尺寸状态
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });
  
  // 鼠标位置跟踪
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 为不同光球创建不同的弹簧配置，使跟随行为更多样化
  const springConfig1 = { damping: 20, stiffness: 80 };   // 较快响应
  const springConfig2 = { damping: 35, stiffness: 60 };   // 较慢响应
  const springConfig3 = { damping: 15, stiffness: 120 };  // 最快响应
  const springConfig4 = { damping: 40, stiffness: 50 };   // 最慢响应
  const springConfig5 = { damping: 25, stiffness: 90 };   // 中等响应
  const springConfig6 = { damping: 30, stiffness: 70 };   // 中慢响应

  // 为每个光球创建独立的平滑鼠标跟踪
  const smoothMouseX1 = useSpring(mouseX, springConfig1);
  const smoothMouseY1 = useSpring(mouseY, springConfig1);
  
  const smoothMouseX2 = useSpring(mouseX, springConfig2);
  const smoothMouseY2 = useSpring(mouseY, springConfig2);
  
  const smoothMouseX3 = useSpring(mouseX, springConfig3);
  const smoothMouseY3 = useSpring(mouseY, springConfig3);
  
  const smoothMouseX4 = useSpring(mouseX, springConfig4);
  const smoothMouseY4 = useSpring(mouseY, springConfig4);
  
  const smoothMouseX5 = useSpring(mouseX, springConfig5);
  const smoothMouseY5 = useSpring(mouseY, springConfig5);
  
  const smoothMouseX6 = useSpring(mouseX, springConfig6);
  const smoothMouseY6 = useSpring(mouseY, springConfig6);

  // 为不同光球创建不同强度和方向的视差效果
  const orb1X = useTransform(smoothMouseX1, [-windowSize.width / 2, windowSize.width / 2], [-35, 35]);
  const orb1Y = useTransform(smoothMouseY1, [-windowSize.height / 2, windowSize.height / 2], [-25, 25]);
  
  const orb2X = useTransform(smoothMouseX2, [-windowSize.width / 2, windowSize.width / 2], [15, -15]);
  const orb2Y = useTransform(smoothMouseY2, [-windowSize.height / 2, windowSize.height / 2], [20, -20]);
  
  const orb3X = useTransform(smoothMouseX3, [-windowSize.width / 2, windowSize.width / 2], [-8, 8]);
  const orb3Y = useTransform(smoothMouseY3, [-windowSize.height / 2, windowSize.height / 2], [-12, 12]);

  const orb4X = useTransform(smoothMouseX4, [-windowSize.width / 2, windowSize.width / 2], [28, -28]);
  const orb4Y = useTransform(smoothMouseY4, [-windowSize.height / 2, windowSize.height / 2], [10, -10]);

  const orb5X = useTransform(smoothMouseX5, [-windowSize.width / 2, windowSize.width / 2], [-18, 18]);
  const orb5Y = useTransform(smoothMouseY5, [-windowSize.height / 2, windowSize.height / 2], [-15, 15]);

  const orb6X = useTransform(smoothMouseX6, [-windowSize.width / 2, windowSize.width / 2], [22, -22]);
  const orb6Y = useTransform(smoothMouseY6, [-windowSize.height / 2, windowSize.height / 2], [18, -18]);

  useEffect(() => {
    /**
     * 更新窗口尺寸
     * 用途：获取当前窗口尺寸并更新状态
     * 输入：无
     * 输出：无
     * 副作用：更新 windowSize 状态
     */
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    /**
     * 鼠标移动事件处理函数（节流优化）
     * 用途：更新鼠标位置，计算相对于屏幕中心的偏移
     * 输入：MouseEvent 事件对象
     * 输出：无
     * 副作用：更新 mouseX 和 mouseY 的值
     */
    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      // 使用 requestAnimationFrame 进行节流，提升性能
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        // 计算相对于屏幕中心的偏移
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
      });
    };

    // 初始化窗口尺寸
    updateWindowSize();

    // 添加事件监听器
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", updateWindowSize, { passive: true });

    // 清理函数
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", updateWindowSize);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-[radial-gradient(600px_200px_at_20%_0%,#7c3aed33,transparent),radial-gradient(500px_200px_at_80%_10%,#06b6d433,transparent)]" />
      
      {/* 主要光球 1 - 紫蓝渐变 */}
      <motion.div
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{
          x: [0, 35, -25, 0],
          y: [0, -30, 25, 0],
          scale: [1, 1.08, 0.96, 1],
        }}
        style={{
          x: orb1X,
          y: orb1Y,
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 0.8, repeatDelay: 1.2 }}
        className="absolute top-[15%] right-[20%] w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 bg-gradient-to-br from-purple-400/12 to-blue-500/12 rounded-full blur-xl mix-blend-screen"
      />
      
      {/* 主要光球 2 - 青紫渐变 */}
      <motion.div
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 25, -20, 0],
          scale: [1, 0.94, 1.06, 1],
        }}
        style={{
          x: orb2X,
          y: orb2Y,
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "circInOut", delay: 1.5, repeatDelay: 0.8 }}
        className="absolute bottom-[25%] left-[12%] w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-60 lg:h-60 xl:w-64 xl:h-64 bg-gradient-to-tr from-cyan-400/10 to-violet-500/10 rounded-full blur-xl mix-blend-screen"
      />
      
      {/* 小光点 - 白色微光 */}
      <motion.div
        initial={{ opacity: 0.25, scale: 0.9 }}
        animate={{
          opacity: [0.1, 0.4, 0.15, 0.1],
          scale: [0.9, 1.12, 0.95, 0.9],
          x: [0, 22, -18, 0],
          y: [0, -18, 14, 0],
        }}
        style={{
          x: orb3X,
          y: orb3Y,
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "circInOut", delay: 0.3, repeatDelay: 0.6 }}
        className="absolute top-[38%] left-[55%] w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-gradient-to-tr from-white/4 to-white/0 rounded-full blur-md mix-blend-screen"
      />

      {/* sm+ 响应式光斑 - 紫红色 */}
      <motion.div
        className="hidden sm:block absolute top-[8%] left-[5%] w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 bg-gradient-to-tr from-fuchsia-400/8 to-purple-400/6 rounded-full blur-lg mix-blend-screen"
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{ 
          x: [0, 22, -18, 0], 
          y: [0, -18, 15, 0], 
          scale: [1, 1.12, 0.94, 1] 
        }}
        style={{
          x: orb4X,
          y: orb4Y,
        }}
        transition={{ duration: 13, repeat: Infinity, ease: "backInOut", delay: 0.4, repeatDelay: 1.0 }}
      />
      
      {/* md+ 响应式光斑 - 天蓝色 */}
      <motion.div
        className="hidden md:block absolute bottom-[12%] right-[15%] w-32 h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 bg-gradient-to-tr from-sky-400/7 to-cyan-300/6 rounded-full blur-lg mix-blend-screen"
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{ 
          x: [0, -28, 22, 0], 
          y: [0, 24, -18, 0], 
          scale: [1, 0.92, 1.18, 1] 
        }}
        style={{
          x: orb5X,
          y: orb5Y,
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "anticipate", delay: 1.8, repeatDelay: 0.5 }}
      />

      {/* xl+ 响应式光斑 - 翠绿色 */}
      <motion.div
        className="hidden xl:block absolute top-[3%] right-[45%] w-36 h-36 2xl:w-44 2xl:h-44 bg-gradient-to-tr from-emerald-300/6 to-teal-300/6 rounded-full blur-xl mix-blend-screen"
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{ 
          x: [0, -32, 26, 0], 
          y: [0, 28, -22, 0], 
          scale: [1, 0.9, 1.16, 1] 
        }}
        style={{
          x: orb6X,
          y: orb6Y,
        }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 1.0, repeatDelay: 0.9 }}
      />
    </>
  );
}