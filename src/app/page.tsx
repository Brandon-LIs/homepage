"use client";
import Image from "next/image";
import Link from "next/link";
import { profile } from "@/data/profile";
import { useMemo, useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import SocialIcon from "@/components/SocialIcon";
import MouseTrackingOrbs from "@/components/MouseTrackingOrbs";

/**
 * Home 页面组件
 * 用途：渲染 QQHKX 个人主页，包括 Hero、关于、技术栈、项目与联系方式。
 * 返回：完整的主页 JSX 结构。
 */
export default function Home() {
  // 页面加载状态管理
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // 模拟页面资源加载完成
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 项目数据直接使用，不再分组
  const projects = profile.projects;

  // 视差滚动：背景轻微上移，营造空间感
  const { scrollY } = useScroll();
  const bgTranslate = useTransform(scrollY, [0, 600], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.7]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);

  // 使用 useMemo 构造信息块，避免在 JSX 中直接书写复杂字面量
  const blocks = useMemo(
    () => [
      {
        title: "关于我",
        content: (
          <p className="text-white/80 leading-7">
            {profile.description}
          </p>
        ),
      },
      {
        title: "技术栈",
        content: (
          <div className="flex flex-wrap gap-2">
            {profile.languages.map((l) => (
              <span key={l} className="px-3 py-1 rounded-full bg-white/10 text-sm">
                {l}
              </span>
            ))}
            {profile.frameworksAndTools.map((f) => (
              <span key={f} className="px-3 py-1 rounded-full bg-white/10 text-sm">
                {f}
              </span>
            ))}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <AnimatePresence>
      {isLoaded && (
        <motion.main 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="min-h-dvh w-full"
        >
          {/* Hero 区域 */}
          <motion.section 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative min-h-dvh mx-auto max-w-6xl px-6 flex items-center py-16 md:py-24 select-none"
          >
            {/* 背景装饰（视差） */}
            <motion.div 
              style={{ y: bgTranslate, opacity: heroOpacity, scale: heroScale }} 
              className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-screen -z-10 opacity-80"
            >
              <MouseTrackingOrbs />
            </motion.div>

            {/* 主要内容区域 - 水平布局 */}
            <div className="w-full max-w-6xl flex flex-col md:flex-row items-start gap-8">
          {/* 头像区域 */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 15, 
              delay: 0.2,
              duration: 0.8
            }}
            className="relative flex-shrink-0 size-32 md:size-40 rounded-full overflow-hidden ring-4 ring-white/20 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
          >
            <Image
              src={profile.avatar}
              alt={profile.avatarAlt}
              fill
              sizes="(max-width: 768px) 128px, 160px"
              className="object-cover"
              priority
            />
          </motion.div>

          {/* 文字内容区域 */}
          <div className="flex-1 text-left">
            {/* 标题区域 */}
            <motion.h1
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                delay: 0.4, 
                duration: 0.9, 
                type: "spring", 
                stiffness: 80, 
                damping: 12
              }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4"
              style={{ letterSpacing: '0.1em' }}
            >
              <span>{profile.siteName}</span>
              <span className="text-3xl md:text-4xl lg:text-5xl font-light" style={{ letterSpacing: '-0.02em' }}>{profile.siteDomain}</span>
            </motion.h1>

            {/* 座右铭区域 */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                delay: 0.6, 
                duration: 0.8, 
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className="mb-6"
            >
              <p className="text-lg md:text-xl text-white/80 leading-relaxed">
                 <TypingText text={profile.motto} speed={120} delay={1500} />
               </p>
            </motion.div>
            
            {/* 角色描述标签 */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                delay: 0.8, 
                duration: 0.8, 
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className="flex flex-wrap items-center gap-3 mb-8 text-xs md:text-sm text-white/70"
            >
              <span className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                {profile.role}
              </span>
              <span className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                {profile.location}
              </span>
              <span className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                前端开发
              </span>
            </motion.div>

             {/* 社交链接 */}
             <motion.div
               initial="hidden"
               animate="show"
               variants={{
                 hidden: { opacity: 0, y: 20 },
                 show: { 
                   opacity: 1, 
                   y: 0, 
                   transition: { 
                     staggerChildren: 0.08, 
                     delayChildren: 1.0,
                     ease: [0.25, 0.46, 0.45, 0.94]
                   } 
                 },
               }}
               className="flex flex-wrap items-center gap-3"
             >
              {profile.socials.map((s) => (
                <motion.div 
                  key={s.name} 
                  variants={{ 
                    hidden: { opacity: 0, y: 15, scale: 0.9 }, 
                    show: { 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                      }
                    } 
                  }}
                >
                  <Link
                    href={s.url}
                    className="relative card-skeu texture-spot flex items-center gap-2 text-sm md:text-base lg:text-lg px-4 py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3 rounded-[20px] hover:opacity-95 transition group"
                    target="_blank"
                  >
                    <SocialIcon 
                      name={s.name} 
                      size={20} 
                      className="group-hover:scale-110 transition-transform duration-200" 
                    />
                    <span className="hidden sm:inline">{s.name}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
         
         {/* 添加向下滚动指示 */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ 
             delay: 1.5, 
             duration: 1.0, 
             ease: [0.25, 0.46, 0.45, 0.94]
           }}
           className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center"
         >
           <motion.div
             animate={{ y: [0, 8, 0] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
             className="w-5 h-8 border border-white/30 rounded-full flex justify-center"
           >
             <div className="w-1 h-2 bg-white/50 rounded-full mt-2"></div>
           </motion.div>
         </motion.div>
          </motion.section>

      {/* 关于与技术栈 */}
      <section className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-6 pb-12">
        {blocks.map((block) => (
          <motion.div
            key={block.title}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative card-skeu texture-spot p-6"
          >
            <h2 className="text-xl font-semibold mb-3">{block.title}</h2>
            {block.content}
          </motion.div>
        ))}
      </section>

      {/* 项目网格 */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
            精选项目
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            探索我的开源项目，涵盖实用工具、Web应用、游戏开发等多个领域
          </p>
        </motion.div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => (
            <motion.div
              key={project.title}
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              whileInView={{ scale: 1, opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ 
                type: "spring", 
                stiffness: 120, 
                damping: 20, 
                delay: idx * 0.1 
              }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className="group relative card-skeu texture-spot p-6 overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              {/* 背景渐变效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* 项目内容 */}
              <div className="relative z-10">
                <Link 
                  href={project.url} 
                  className="block" 
                  target="_blank"
                >
                  {/* 项目标题 */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-white/90 group-hover:text-white transition-colors duration-200 text-lg leading-tight">
                      {project.title}
                    </h3>
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors duration-200">
                        <svg className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M7 17L17 7" />
                          <path d="M8 7h9v9" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* 项目描述 */}
                  <p className="text-white/70 text-sm leading-relaxed mb-4 group-hover:text-white/80 transition-colors duration-200">
                    {project.description}
                  </p>
                  
                  {/* 项目标签 */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {project.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="px-2.5 py-1 text-xs rounded-full bg-white/10 border border-white/20 text-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/15 hover:border-white/30 hover:text-white/90"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* 项目来源标识 */}
                  <div className="text-xs text-white/50">
                    开源项目 · GitHub
                  </div>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* 查看更多按钮 */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link
            href="https://github.com/QQHKX"
            target="_blank"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/20 backdrop-blur-sm hover:from-blue-500/30 hover:to-purple-500/30 hover:border-white/30 transition-all duration-300 group"
          >
            <span className="text-white/90 font-medium">查看更多项目</span>
            <svg className="w-5 h-5 text-white/60 group-hover:text-white/80 group-hover:translate-x-1 transition-all duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </section>

      {/* 联系方式/页脚 */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-white/70">
          {/* 主要页脚内容 */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex flex-col items-center md:items-start gap-2">
              <div>
                © {new Date().getFullYear()} {profile.name}. All rights reserved.
              </div>
              {profile.icpNumber && (
                <div className="text-xs text-white/50">
                  <Link 
                    href="https://beian.miit.gov.cn/" 
                    target="_blank" 
                    className="hover:text-white/70 transition-colors duration-200"
                  >
                    {profile.icpNumber}
                  </Link>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {profile.socials.map((s) => (
                <Link key={s.name} href={s.url} className="hover:text-white hover:scale-110 transition-all duration-200" target="_blank">
                  <SocialIcon 
                    name={s.name} 
                    size={18} 
                    className="opacity-70 hover:opacity-100 transition-opacity duration-200" 
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
        </motion.main>
      )}
    </AnimatePresence>
  );
}

/**
 * 打字机效果组件
 * @param text - 要显示的文本
 * @param speed - 打字速度（毫秒）
 * @param delay - 开始打字前的延迟时间（毫秒）
 */
function TypingText({ text, speed = 80, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [index, setIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [started, setStarted] = useState(false);
  
  // 处理初始延迟
  useEffect(() => {
    if (delay > 0) {
      const startTimer = setTimeout(() => {
        setStarted(true);
      }, delay);
      return () => clearTimeout(startTimer);
    } else {
      setStarted(true);
    }
  }, [delay]);
  
  useEffect(() => {
    if (!started || index >= text.length) return;
    
    // 检查当前字符是否为逗号，如果是则增加停顿时间
     const currentChar = text[index - 1];
     const isComma = currentChar === '，' || currentChar === ',';
     const typingDelay = isComma ? speed * 5 : speed; // 逗号处停顿5倍时间
    
    const timer = setTimeout(() => {
      setIndex((i) => (i < text.length ? i + 1 : i));
    }, typingDelay);
    
    return () => clearTimeout(timer);
  }, [started, index, text, speed]);

  // 光标闪烁效果
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <span aria-label={text} aria-live="polite" className="relative">
      {text.slice(0, index)}
      <motion.span
        animate={{ opacity: showCursor ? 1 : 0 }}
        transition={{ duration: 0.1 }}
        className="inline-block w-0.5 h-5 bg-white/70 ml-0.5 align-middle"
      />
    </span>
  );
}
