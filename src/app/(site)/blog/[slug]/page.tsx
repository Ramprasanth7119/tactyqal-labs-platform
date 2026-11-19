import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/container";
import { findPostBySlug, getRelatedPosts } from "@/lib/blog/posts";
import { env } from "@/lib/env";
import { PostCard, formatDate } from "../_components/post-card";
import "../blog.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await findPostBySlug(slug);
  if (!post) return { title: "Post not found | Tactyqal Labs", robots: { index: false } };
  const url = `${env.siteUrl}/blog/${post.slug}`;
  const description = post.seoDescription || post.excerpt;
  const title = post.seoTitle || post.title;
  return {
    title: `${title} | Tactyqal Labs`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author.name] : undefined,
      tags: post.tags.map((t) => t.name),
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
    twitter: { card: post.coverImageUrl ? "summary_large_image" : "summary", title, description },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await findPostBySlug(slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post, 3);
  const url = `${env.siteUrl}/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: url,
    url,
    image: post.coverImageUrl ?? undefined,
    author: post.author ? { "@type": "Person", name: post.author.name } : { "@type": "Organization", name: "Tactyqal Labs" },
    publisher: { "@type": "Organization", name: "Tactyqal Labs", url: env.siteUrl },
    keywords: post.tags.map((t) => t.name).join(", ") || undefined,
    timeRequired: `PT${post.readingMinutes}M`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Container className="py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/blog" className="font-semibold text-accent-deep hover:underline">
            &larr; All posts
          </Link>
        </nav>

        <article className="mx-auto mt-6 max-w-3xl">
          <header>
            {post.category && (
              <Link
                href={`/blog?category=${post.category.slug}`}
                className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-deep hover:underline"
              >
                {post.category.name}
              </Link>
            )}
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.2rem)] font-extrabold">{post.title}</h1>
            {post.excerpt && <p className="mt-4 text-lg text-muted">{post.excerpt}</p>}
            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              {post.author && <span className="font-semibold text-ink">By {post.author.name}</span>}
              <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
              <span aria-hidden>&middot;</span>
              <span>{post.readingMinutes} min read</span>
            </p>
          </header>

          {post.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImageUrl} alt="" className="mt-8 w-full rounded-2xl border-2 border-ink object-cover" />
          )}

          <div className="blog-prose mt-10" dangerouslySetInnerHTML={{ __html: post.contentHtml ?? "" }} />

          {post.tags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2 border-t-2 border-line pt-6 text-sm">
              {post.tags.map((t) => (
                <li key={t.id}>
                  <Link href={`/blog?tag=${t.slug}`} className="rounded-md bg-sand px-2.5 py-1 text-ink-2 hover:bg-line">
                    #{t.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        {related.length > 0 && (
          <section aria-labelledby="related" className="mx-auto mt-16 max-w-6xl">
            <h2 id="related" className="font-display text-2xl font-extrabold">
              Keep reading
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
