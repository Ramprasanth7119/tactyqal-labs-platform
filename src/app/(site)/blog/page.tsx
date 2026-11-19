import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { listPosts } from "@/lib/blog/posts";
import { listCategories, listTags } from "@/lib/blog/taxonomy";
import { env } from "@/lib/env";
import { PostCard } from "./_components/post-card";

export const dynamic = "force-dynamic";

type Search = { q?: string; category?: string; tag?: string; page?: string };

export const metadata: Metadata = {
  title: "Blog | Tactyqal Labs",
  description: "Startup ideas, founder playbooks and practical guides for young entrepreneurs building their first app.",
  alternates: { canonical: `${env.siteUrl}/blog`, types: { "application/rss+xml": `${env.siteUrl}/blog/rss.xml` } },
};

function href(params: Search, overrides: Partial<Search>) {
  const merged = { ...params, ...overrides };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v && !(k === "page" && v === "1")) qs.set(k, v);
  const s = qs.toString();
  return s ? `/blog?${s}` : "/blog";
}

export default async function BlogIndex({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const [result, categories, tags] = await Promise.all([
    listPosts({ page, limit: 9, q: sp.q, category: sp.category, tag: sp.tag }).catch(() => null),
    listCategories(),
    listTags(),
  ]);
  const filtered = Boolean(sp.q || sp.category || sp.tag);
  const pill = (active: boolean) =>
    `rounded-full border-2 border-ink px-4 py-1.5 text-sm font-semibold transition-colors ${active ? "bg-ink text-cream" : "bg-paper hover:bg-sand"}`;

  return (
    <Container className="py-12 sm:py-16">
      <SectionHeading as="h1" eyebrow="The Tactyqal blog" title="Ideas, playbooks and honest advice for young founders">
        Pitching, team building, idea validation and long lists of things worth building.
      </SectionHeading>

      <form action="/blog" method="get" role="search" className="mt-8 flex max-w-xl gap-3">
        <label htmlFor="blog-q" className="sr-only">
          Search posts
        </label>
        <input
          id="blog-q"
          name="q"
          type="search"
          defaultValue={sp.q ?? ""}
          placeholder="Search posts..."
          className="min-w-0 flex-1 rounded-full border-2 border-ink bg-paper px-5 py-3 text-base outline-offset-2"
        />
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        {sp.tag && <input type="hidden" name="tag" value={sp.tag} />}
        <button type="submit" className="rounded-full border-2 border-ink bg-accent px-6 py-3 font-semibold shadow-[3px_3px_0_0_var(--color-ink)]">
          Search
        </button>
      </form>

      <nav aria-label="Filter by category" className="mt-6 flex flex-wrap gap-2">
        <Link href={href(sp, { category: undefined, page: undefined })} className={pill(!sp.category)}>
          All
        </Link>
        {categories
          .filter((c) => c.postCount > 0 || c.slug === sp.category)
          .map((c) => (
            <Link key={c.id} href={href(sp, { category: c.slug, page: undefined })} className={pill(sp.category === c.slug)}>
              {c.name} <span className="text-muted">({c.postCount})</span>
            </Link>
          ))}
      </nav>
      {tags.some((t) => t.postCount > 0) && (
        <nav aria-label="Filter by tag" className="mt-3 flex flex-wrap gap-2 text-sm">
          {tags
            .filter((t) => t.postCount > 0)
            .map((t) => (
              <Link
                key={t.id}
                href={href(sp, { tag: sp.tag === t.slug ? undefined : t.slug, page: undefined })}
                className={`rounded-md px-2.5 py-1 ${sp.tag === t.slug ? "bg-ink text-cream" : "bg-sand text-ink-2 hover:bg-line"}`}
              >
                #{t.name}
              </Link>
            ))}
        </nav>
      )}

      {!result ? (
        <p className="mt-12 rounded-2xl border-2 border-ink bg-paper p-8 text-center">Something went wrong loading posts. Please try again.</p>
      ) : result.items.length === 0 ? (
        <div className="mt-12 rounded-2xl border-2 border-dashed border-ink bg-paper p-10 text-center">
          <p className="font-display text-xl font-extrabold">{filtered ? "No posts match that search." : "No posts yet."}</p>
          {filtered && (
            <Link href="/blog" className="mt-3 inline-block font-semibold text-accent-deep underline">
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="mt-8 text-sm text-muted" aria-live="polite">
            {result.meta.total} {result.meta.total === 1 ? "post" : "posts"}
            {sp.q ? ` matching “${sp.q}”` : ""}
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
          {result.meta.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-4">
              {page > 1 ? (
                <Link href={href(sp, { page: String(page - 1) })} rel="prev" className={pill(false)}>
                  &larr; Newer
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-muted">
                Page {result.meta.page} of {result.meta.totalPages}
              </span>
              {result.meta.hasNext ? (
                <Link href={href(sp, { page: String(page + 1) })} rel="next" className={pill(false)}>
                  Older &rarr;
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </Container>
  );
}
