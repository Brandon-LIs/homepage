import Image from "next/image";
import type { Post } from "@/lib/posts";

export default function PostCard({ post }: { post: Post }) {
  return (
    <a
      className="post"
      href={post.href}
      target="_blank"
      rel="noopener"
      aria-label={`${post.title}（在新标签页打开）`}
    >
      <div className="post__cover">
        {post.cover ? (
          // 封面已由 scripts/process-covers.py 统一降饱和成低彩版本，
          // 避免博客的彩色配图把这套纸墨配色搅乱。
          <Image
            src={post.cover}
            alt=""
            fill
            sizes="(max-width: 720px) 100vw, 300px"
            className="post__img"
          />
        ) : (
          <span className="post__cover-fallback" aria-hidden="true" />
        )}
      </div>
      <div className="post__text">
        {post.dateLabel ? (
          <time className="post__date" dateTime={post.date}>
            {post.dateLabel}
          </time>
        ) : null}
        <h3 className="post__title">{post.title}</h3>
        <p className="post__summary">{post.summary}</p>
      </div>
    </a>
  );
}
