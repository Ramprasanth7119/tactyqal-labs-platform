import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/site/button";
import type { PostSummary } from "@/lib/blog/public";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function BlogTeaser({ posts }: { posts: PostSummary[] }) {
  return (
    <section aria-labelledby="blog-title" className="py-20 sm:py-28">
      <Container>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading id="blog-title" eyebrow="From the blog" title="Ideas worth reading">
            Practical reading on startup ideas, teams and launching.
          </SectionHeading>
          <Button href="/blog" variant="secondary" className="self-start md:self-auto">
            Read all articles <ArrowRight size={16} aria-hidden />
          </Button>
        </div>
        {posts.length > 0 && (
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {posts.map((p) => (
              <li key={p.slug}>
                <article className="group relative flex h-full flex-col rounded-3xl border-2 border-ink bg-paper p-6 shadow-card transition-transform duration-200 hover:-translate-y-1">
                  {p.category && (
                    <span className="mb-4 inline-block self-start rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-deep">
                      {p.category.name}
                    </span>
                  )}
                  <h3 className="font-display text-xl font-extrabold leading-snug">
                    <Link
                      href={`/blog/${p.slug}`}
                      className="after:absolute after:inset-0 after:rounded-3xl hover:underline"
                    >
                      {p.title}
                    </Link>
                  </h3>
                  <p className="mt-3 line-clamp-3 text-muted">{p.excerpt}</p>
                  <p className="mt-auto flex items-center gap-3 pt-5 text-sm text-muted">
                    <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} aria-hidden /> {p.readingMinutes} min read
                    </span>
                  </p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
