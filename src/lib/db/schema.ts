import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const POST_STATUSES = ["draft", "published", "scheduled", "archived"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const authors = sqliteTable("authors", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  email: text("email"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: createdAt(),
});

export const categories = sqliteTable("categories", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: createdAt(),
});

export const tags = sqliteTable("tags", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: createdAt(),
});

export const posts = sqliteTable(
  "posts",
  {
    id: id(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    /** Markdown source of truth. */
    content: text("content").notNull().default(""),
    /** Sanitized HTML rendered from `content` at write time (read-optimised cache). */
    contentHtml: text("content_html").notNull().default(""),
    coverImageUrl: text("cover_image_url"),
    status: text("status", { enum: POST_STATUSES }).notNull().default("draft"),
    /** Publish moment. For `scheduled` posts this is the go-live time. */
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    readingMinutes: integer("reading_minutes").notNull().default(1),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    authorId: text("author_id").references(() => authors.id, { onDelete: "set null" }),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    /** Where the post came from, e.g. the old WordPress URL (migration trail). */
    legacyUrl: text("legacy_url"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    /** Soft delete marker; NULL = live. */
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    /** Optimistic concurrency counter, +1 on every write. */
    version: integer("version").notNull().default(1),
  },
  (t) => [
    uniqueIndex("posts_slug_uq").on(t.slug),
    // Public listing: WHERE status/published_at ORDER BY published_at DESC
    index("posts_status_published_idx").on(t.status, t.publishedAt),
    index("posts_category_idx").on(t.categoryId),
    index("posts_author_idx").on(t.authorId),
    index("posts_deleted_idx").on(t.deletedAt),
  ],
);

export const postTags = sqliteTable(
  "post_tags",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] }), index("post_tags_tag_idx").on(t.tagId)],
);

export const postRevisions = sqliteTable(
  "post_revisions",
  {
    id: id(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    /** Equals the post `version` this snapshot was taken at. */
    version: integer("version").notNull(),
    /** JSON-encoded PostSnapshot (see src/lib/blog/types.ts). */
    snapshot: text("snapshot").notNull(),
    summary: text("summary").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("post_revisions_post_version_uq").on(t.postId, t.version)],
);
