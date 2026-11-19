import Link from "next/link";
import type { PostDTO } from "@/lib/blog/types";

const TINTS = ["bg-sage", "bg-sun", "bg-sky", "bg-rose", "bg-accent-soft"];

export function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function tintFor(slug: string) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

export function PostCard({ post }: { post: PostDTO }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-card transition-transform duration-200 hover:-translate-y-1">
      <Link href={`/blog/${post.slug}`} className="block" aria-hidden tabIndex={-1}>
        {post.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImageUrl} alt="" loading="lazy" className="aspect-[16/9] w-full border-b-2 border-ink object-cover" />
        ) : (
          <div className={`flex aspect-[16/9] items-end border-b-2 border-ink p-4 ${tintFor(post.slug)}`}>
            <span className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-ink/70">
              {post.category?.name ?? "Tactyqal"}
            </span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {post.category && (
            <Link href={`/blog?category=${post.category.slug}`} className="text-accent-deep hover:underline">
              {post.category.name}
            </Link>
          )}
          {post.category && " · "}
          <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
        </p>
        <h2 className="mt-2 font-display text-xl font-extrabold leading-tight">
          <Link href={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="mt-2 flex-1 text-[0.95rem] text-muted">{post.excerpt}</p>
        <p className="mt-4 text-sm text-muted">
          {post.author?.name ? `By ${post.author.name} · ` : ""}
          {post.readingMinutes} min read
        </p>
      </div>
    </article>
  );
}
