import Image from "next/image";
import Link from "next/link";
import DotField from "@/components/DotField";
import Reveal from "@/components/Reveal";
import PostCard from "@/components/PostCard";
import { getRecentPosts } from "@/lib/posts";
import {
  HERO,
  FACTS,
  SETUP,
  SKILLS,
  PROJECTS,
  SOCIALS,
  SITE,
  BLOG_STATS,
  ABOUT_PARAGRAPHS,
} from "@/data/site";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Work />
      <Writing />
      <Contact />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      {/* 背光纸幕：皮影的灯从纸后面透出来。装饰层，纯 CSS 背景 */}
      <div className="hero__screen" aria-hidden="true" />

      {/* 指针反应点阵：桌面精细指针才挂载，触屏返回 null */}
      <DotField />

      <div className="container hero__inner">
        <p className="hero__greeting hero-anim" style={{ animationDelay: "0ms" }}>
          <span className="hero__dot" aria-hidden="true" />
          {HERO.greeting}
        </p>

        <h1 id="hero-title" className="hero__title">
          {HERO.headline.map((line, i) => (
            <span key={i} className="hero__line">
              <span
                className="hero__line-inner hero-anim"
                style={{ animationDelay: `${70 + i * 80}ms` }}
              >
                {line.map((seg, j) => (
                  <span
                    key={j}
                    className={seg.accent ? "hero__accent" : undefined}
                  >
                    {seg.text}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </h1>

        <p
          className="hero__lede hero-anim--fade"
          style={{ animationDelay: "230ms" }}
        >
          {HERO.lede}
        </p>

        <div
          className="hero__actions hero-anim--fade"
          style={{ animationDelay: "310ms" }}
        >
          <Link href="/#work" className="btn btn--primary">
            看看我做了什么
          </Link>
          <a
            href={SITE.blog}
            target="_blank"
            rel="noopener"
            className="btn btn--ghost"
          >
            去博客逛逛
            <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true">
              <path
                d="M4 10 10 4M5.4 4H10v4.6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </a>
        </div>

        <p
          className="hero__meta hero-anim--fade"
          style={{ animationDelay: "390ms" }}
        >
          {HERO.meta}
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 关于                                                                        */
/* -------------------------------------------------------------------------- */

function About() {
  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="container">
        <Reveal>
          <p className="section-index">
            <span>01</span> 关于
          </p>
          <h2 id="about-title" className="section-title">
            一个还在长大的开发者
          </h2>
        </Reveal>

        <div className="about__grid">
          <Reveal className="about__main" delay={60}>
            <div className="prose">
              {ABOUT_PARAGRAPHS.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>

            <figure className="about__card">
              <Image
                src="/avatar.webp"
                alt="Brandon 的头像"
                width={120}
                height={120}
                className="about__avatar"
                priority
                sizes="120px"
              />
              <figcaption>
                <span className="about__card-name">{SITE.motto}</span>
                <span className="about__card-note">
                  {SITE.name} · 宜昌 · 高中生开发者
                </span>
              </figcaption>
            </figure>
          </Reveal>

          <Reveal className="about__facts" delay={140} as="div">
            <ul role="list" className="facts">
              {FACTS.map((fact) => (
                <li key={fact.label} className="fact">
                  <span className="fact__label">{fact.label}</span>
                  <span className="fact__value">{fact.value}</span>
                  <span className="fact__detail">{fact.detail}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <div className="setup">
            <h3 className="setup__title">平时用什么</h3>
            <dl className="setup__list">
              {SETUP.map((row) => (
                <div key={row.label} className="setup__row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="skills">
            <h3 className="skills__title">手上会的东西</h3>
            <dl className="skills__grid">
              {SKILLS.map((group) => (
                <div key={group.group} className="skills__group">
                  <dt>{group.group}</dt>
                  <dd>
                    <ul role="list" className="tags">
                      {group.items.map((item) => (
                        <li key={item} className="tag">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 项目                                                                        */
/* -------------------------------------------------------------------------- */

function Work() {
  return (
    <section
      id="work"
      className="section section--surface"
      aria-labelledby="work-title"
    >
      <div className="container">
        <Reveal>
          <p className="section-index">
            <span>02</span> 项目
          </p>
          <h2 id="work-title" className="section-title">
            做过的东西
          </h2>
          <p className="section-lede prose">
            大多是为了解决自己遇到的问题。技术选择上有个共同偏好：跑在免费额度上，
            数据留在自己手里。
          </p>
        </Reveal>

        <Reveal delay={60}>
          <figure className="work__figure">
            <Image
              src="/textures/shadow-play.avif"
              alt="皮影戏台：暖橙色的灯光从纸幕后面透出，幕上是一组剪影人物与亭台树木"
              width={1200}
              height={800}
              sizes="(max-width: 900px) 100vw, 900px"
              className="work__img"
            />
            <figcaption>
              「幕影千年」的现场。灯光从皮影背面打过来，观众看到的是影子。
            </figcaption>
          </figure>
        </Reveal>

        <ul role="list" className="projects">
          {PROJECTS.map((p, i) => (
            <Reveal as="li" key={p.name} delay={i * 70} className="project">
              <div className="project__head">
                <span className="project__year">
                  {p.year} · {p.category}
                </span>
                <h3 className="project__name">{p.name}</h3>
                <p className="project__tagline">{p.tagline}</p>
              </div>
              <div className="project__body">
                <p className="project__detail">{p.detail}</p>
                <ul role="list" className="tags tags--sm">
                  {p.stack.map((s) => (
                    <li key={s} className="tag">
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="project__links">
                  <a
                    className="project__link"
                    href={p.href}
                    target="_blank"
                    rel="noopener"
                  >
                    {p.hrefLabel}
                    <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
                      <path
                        d="M4 10 10 4M5.4 4H10v4.6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </a>
                  {"demo" in p && p.demo ? (
                    <a
                      className="project__link project__link--muted"
                      href={p.demo}
                      target="_blank"
                      rel="noopener"
                    >
                      在线试用
                      <svg
                        viewBox="0 0 14 14"
                        width="12"
                        height="12"
                        aria-hidden="true"
                      >
                        <path
                          d="M4 10 10 4M5.4 4H10v4.6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </a>
                  ) : null}
                </div>
              </div>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={60}>
          <a
            className="work__more"
            href={SITE.github + "?tab=repositories"}
            target="_blank"
            rel="noopener"
          >
            还有三十来个仓库在 GitHub
            <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true">
              <path
                d="M4 10 10 4M5.4 4H10v4.6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 写作                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * 文章列表。
 *
 * 这里刻意不用 <Suspense> 流式渲染：首页是构建期预渲染的静态页，
 * 文章在构建时就已取好，流式渲染只会让 HTML 里同时出现骨架屏和真实内容
 * （无 JS 环境会看到两份列表）。直接 await，产物干净。
 */
async function RecentPosts() {
  const posts = await getRecentPosts(4);
  return (
    <ul role="list" className="posts">
      {posts.map((post, i) => (
        <Reveal as="li" key={post.href} delay={i * 70} className="post-item">
          <PostCard post={post} />
        </Reveal>
      ))}
    </ul>
  );
}

async function Writing() {
  return (
    <section id="writing" className="section" aria-labelledby="writing-title">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <div>
              <p className="section-index">
                <span>03</span> 写作
              </p>
              <h2 id="writing-title" className="section-title">
                最近写了什么
              </h2>
              <p className="section-lede prose">
                博客从 {BLOG_STATS.since} 开始更新，技术笔记和生活记录混在一起。
                内容源自我真正做过的事。
              </p>
            </div>
            <a
              className="section-head__link"
              href={SITE.blog + "/blog"}
              target="_blank"
              rel="noopener"
            >
              全部文章
              <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
                <path
                  d="M4 10 10 4M5.4 4H10v4.6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </a>
          </div>
        </Reveal>

        <RecentPosts />      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 联系                                                                        */
/* -------------------------------------------------------------------------- */

function Contact() {
  return (
    <section
      id="contact"
      className="section section--surface"
      aria-labelledby="contact-title"
    >
      <div className="container">
        <Reveal>
          <p className="section-index">
            <span>04</span> 联系
          </p>
          <h2 id="contact-title" className="section-title">
            想聊点什么的话
          </h2>
          <p className="section-lede prose">
            对项目有疑问、想交流技术、或者只是路过来打个招呼，都可以直接找我。
            邮件和 GitHub 是最可靠的两种方式。
          </p>
        </Reveal>

        <Reveal delay={80}>
          <ul role="list" className="contacts">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  className="contact"
                  href={s.href}
                  {...(s.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener" }
                    : {})}
                >
                  <span className="contact__label">{s.label}</span>
                  <span className="contact__handle">{s.handle}</span>
                  <span className="contact__note">{s.note}</span>
                  <svg
                    className="contact__arrow"
                    viewBox="0 0 14 14"
                    width="14"
                    height="14"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 10 10 4M5.4 4H10v4.6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
