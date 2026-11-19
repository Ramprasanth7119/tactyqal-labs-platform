import type { PostStatus } from "@/lib/db/schema";

export type { PostStatus };

export type TermRef = { id: string; name: string; slug: string };

export type PostDTO = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Markdown source. Omitted from list responses unless `include=content`. */
  content?: string;
  contentHtml?: string;
  coverImageUrl: string | null;
  /** Effective status: a `scheduled` post whose time has passed reads as `published`. */
  status: PostStatus;
  publishedAt: string | null;
  readingMinutes: number;
  seoTitle: string | null;
  seoDescription: string | null;
  author: { id: string; name: string; slug: string } | null;
  category: TermRef | null;
  tags: TermRef[];
  legacyUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
};

/** Everything needed to rebuild a post's editable state. Stored (JSON) in post_revisions. */
export type PostSnapshot = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  status: PostStatus;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  authorId: string | null;
  categoryId: string | null;
  tagIds: string[];
  legacyUrl: string | null;
};

export type RevisionDTO = {
  id: string;
  postId: string;
  version: number;
  summary: string;
  createdAt: string;
  snapshot?: PostSnapshot;
};

export type Page<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean };
};
