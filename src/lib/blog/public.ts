// Contract between the homepage and the blog backend.
// The homepage imports getLatestPosts(); the blog backend owns the implementation.
import { listPosts } from "./posts";

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  publishedAt: string; // ISO date
  readingMinutes: number;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
  author: { name: string } | null;
};

/** Latest publicly visible posts (scheduled posts appear once their time has come). Never throws. */
export async function getLatestPosts(limit = 3): Promise<PostSummary[]> {
  try {
    const { items } = await listPosts({ page: 1, limit: Math.min(Math.max(limit, 1), 50), sort: "-publishedAt" });
    return items.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverImageUrl: p.coverImageUrl,
      publishedAt: p.publishedAt ?? p.createdAt,
      readingMinutes: p.readingMinutes,
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
      tags: p.tags.map((t) => ({ name: t.name, slug: t.slug })),
      author: p.author ? { name: p.author.name } : null,
    }));
  } catch (err) {
    // The homepage must still render if the blog database is unavailable.
    console.error("[blog] getLatestPosts failed:", err);
    return [];
  }
}
