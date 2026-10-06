import Link from "next/link";
import { SITE, SOCIALS, BLOG_STATS } from "@/data/site";

const COLUMNS = [
  {
    title: "本站",
    links: [
      { label: "关于我", href: "/#about" },
      { label: "做过的项目", href: "/#work" },
      { label: "最近写作", href: "/#writing" },
      { label: "联系方式", href: "/#contact" },
    ],
  },
  {
    title: "去别处",
    links: [
      { label: "博客", href: SITE.blog, ext: true },
      { label: "RSS 订阅", href: BLOG_STATS.rss, ext: true },
      { label: "服务状态", href: SITE.status, ext: true },
      { label: "站点地图", href: BLOG_STATS.sitemap, ext: true },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <p className="site-footer__motto">我们都有光明的未来</p>
          <p className="site-footer__desc">
            {SITE.name}，宜昌高中生，在写代码和写生活之间来回切换。
          </p>
        </div>

        <nav className="site-footer__nav" aria-label="页脚导航">
          {COLUMNS.map((col) => (
            <div key={col.title} className="site-footer__col">
              <h2 className="site-footer__col-title">{col.title}</h2>
              <ul role="list" className="site-footer__list">
                {col.links.map((link) =>
                  "ext" in link && link.ext ? (
                    <li key={link.label}>
                      <a href={link.href} target="_blank" rel="noopener">
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}

          <div className="site-footer__col">
            <h2 className="site-footer__col-title">保持联系</h2>
            <ul role="list" className="site-footer__list">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    {...(s.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener" }
                      : {})}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="site-footer__bottom">
          <p>
            © {year} {SITE.name} · 内容采用{" "}
            <a href={SITE.license.href} target="_blank" rel="noopener">
              {SITE.license.text}
            </a>{" "}
            许可
          </p>
          <p className="site-footer__icp">
            {SITE.icp.map((item, i) => (
              <span key={item.text}>
                {i > 0 ? " · " : null}
                <a href={item.href} target="_blank" rel="noopener">
                  {item.text}
                </a>
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
