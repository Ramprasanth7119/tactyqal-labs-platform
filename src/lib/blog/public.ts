// Contract between the homepage and the blog backend.
// The homepage imports getLatestPosts(); the blog backend owns the implementation.
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

// TEMPORARY: replaced by the blog backend with a real database query.
export async function getLatestPosts(limit = 3): Promise<PostSummary[]> {
  void limit;
  return [];
}
