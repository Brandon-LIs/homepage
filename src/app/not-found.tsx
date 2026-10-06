import Link from "next/link";
import { SITE } from "@/data/site";

export default function NotFound() {
  return (
    <section className="section notfound">
      <div className="container">
        <p className="notfound__code">404</p>
        <h1 className="notfound__title">这个页面不存在</h1>
        <p className="notfound__text">
          你要找的东西可能被移走了，或者地址打错了。
        </p>
        <div className="hero__actions">
          <Link href="/" className="btn btn--primary">
            回到首页
          </Link>
          <a
            href={SITE.blog}
            target="_blank"
            rel="noopener"
            className="btn btn--ghost"
          >
            去博客看看
          </a>
        </div>
      </div>
    </section>
  );
}
