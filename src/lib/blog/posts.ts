import { and, asc, count, desc, eq, exists, inArray, isNotNull, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db/client";
import { authors, categories, postRevisions, posts, postTags, tags } from "@/lib/db/schema";
import { AppError, invalid, notFound, unauthorized } from "./errors";
import { deriveExcerpt, readingMinutes, renderMarkdown } from "./markdown";
import { uniqueSlug } from "./slug";
import { defaultAuthorId, liveCondition, resolveCategory, resolveTags, visibleCondition } from "./taxonomy";
import type { Page, PostDTO, PostSnapshot, RevisionDTO } from "./types";
import {
  listPostsSchema,
  type CreatePostInput,
  type ListPostsParams,
  type UpdatePostInput,
} from "./validation";
import type { z } from "zod";

type PostRow = typeof posts.$inferSelect;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type Ctx = { admin?: boolean; now?: Date };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

// ---------------------------------------------------------------------------
// Hydration: rows -> DTOs (batched author/category/tag lookups, no N+1)
// ---------------------------------------------------------------------------

async function hydrate(db: Db, rows: PostRow[], opts: { content: boolean; now: Date }): Promise<PostDTO[]> {
  if (rows.length === 0) return [];
  const postIds = rows.map((r) => r.id);
  const authorIds = [...new Set(rows.map((r) => r.authorId).filter((x): x is string => !!x))];
  const categoryIds = [...new Set(rows.map((r) => r.categoryId).filter((x): x is string => !!x))];

  const [authorRows, categoryRows, tagRows] = await Promise.all([
    authorIds.length ? db.select().from(authors).where(inArray(authors.id, authorIds)) : [],
    categoryIds.length ? db.select().from(categories).where(inArray(categories.id, categoryIds)) : [],
    db
      .select({ postId: postTags.postId, id: tags.id, name: tags.name, slug: tags.slug })
      .from(postTags)
      .innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(inArray(postTags.postId, postIds))
      .orderBy(asc(tags.name)),
  ]);
  const authorMap = new Map(authorRows.map((a) => [a.id, a]));
  const categoryMap = new Map(categoryRows.map((c) => [c.id, c]));
  const tagMap = new Map<string, { id: string; name: string; slug: string }[]>();
  for (const t of tagRows) {
    const list = tagMap.get(t.postId) ?? [];
    list.push({ id: t.id, name: t.name, slug: t.slug });
    tagMap.set(t.postId, list);
  }

  return rows.map((r) => {
    const a = r.authorId ? authorMap.get(r.authorId) : undefined;
    const c = r.categoryId ? categoryMap.get(r.categoryId) : undefined;
    const due = r.status === "scheduled" && r.publishedAt && r.publishedAt <= opts.now;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      ...(opts.content ? { content: r.content, contentHtml: r.contentHtml } : {}),
      coverImageUrl: r.coverImageUrl,
      status: due ? "published" : r.status,
      publishedAt: iso(r.publishedAt),
      readingMinutes: r.readingMinutes,
      seoTitle: r.seoTitle,
      seoDescription: r.seoDescription,
      author: a ? { id: a.id, name: a.name, slug: a.slug } : null,
      category: c ? { id: c.id, name: c.name, slug: c.slug } : null,
      tags: tagMap.get(r.id) ?? [],
      legacyUrl: r.legacyUrl,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      deletedAt: iso(r.deletedAt),
      version: r.version,
    } satisfies PostDTO;
  });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const SORT_COLUMNS = {
  publishedAt: posts.publishedAt,
  createdAt: posts.createdAt,
  updatedAt: posts.updatedAt,
  title: posts.title,
  readingMinutes: posts.readingMinutes,
} as const;

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

export async function listPosts(rawParams: Partial<z.input<typeof listPostsSchema>> = {}, ctx: Ctx = {}): Promise<Page<PostDTO>> {
  const params: ListPostsParams = listPostsSchema.parse(rawParams);
  const now = ctx.now ?? new Date();
  const db = await getDb();
  const where: (SQL | undefined)[] = [];

  if (!ctx.admin) {
    if (params.status && params.status !== "published") throw unauthorized("Only admins can filter by that status");
    if (params.deleted && params.deleted !== "false") throw unauthorized("Only admins can see deleted posts");
    where.push(liveCondition(now));
  } else {
    const status = params.status ?? "published";
    if (status === "published") where.push(visibleCondition(now));
    else if (status === "scheduled") {
      where.push(and(eq(posts.status, "scheduled"), or(isNull(posts.publishedAt), sql`${posts.publishedAt} > ${now.getTime()}`)));
    } else if (status !== "all") where.push(eq(posts.status, status));
    if (params.deleted === "only") where.push(isNotNull(posts.deletedAt));
    else if (params.deleted !== "true") where.push(isNull(posts.deletedAt));
  }

  if (params.q) {
    for (const term of params.q.split(/\s+/).filter(Boolean).slice(0, 6)) {
      const p = `%${escapeLike(term)}%`;
      where.push(
        or(
          sql`${posts.title} LIKE ${p} ESCAPE '\\'`,
          sql`${posts.excerpt} LIKE ${p} ESCAPE '\\'`,
          sql`${posts.content} LIKE ${p} ESCAPE '\\'`,
        ),
      );
    }
  }
  if (params.tag) {
    where.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(postTags)
          .innerJoin(tags, eq(tags.id, postTags.tagId))
          .where(and(eq(postTags.postId, posts.id), eq(tags.slug, params.tag))),
      ),
    );
  }
  if (params.category) {
    where.push(inArray(posts.categoryId, db.select({ id: categories.id }).from(categories).where(eq(categories.slug, params.category))));
  }
  if (params.author) {
    where.push(inArray(posts.authorId, db.select({ id: authors.id }).from(authors).where(eq(authors.slug, params.author))));
  }

  const condition = and(...where);
  const desc_ = params.sort.startsWith("-");
  const col = SORT_COLUMNS[params.sort.replace(/^-/, "") as keyof typeof SORT_COLUMNS];
  const order = desc_ ? desc(col) : asc(col);

  const [{ total }] = await db.select({ total: count() }).from(posts).where(condition);
  const rows = await db
    .select()
    .from(posts)
    .where(condition)
    .orderBy(order, desc(posts.createdAt))
    .limit(params.limit)
    .offset((params.page - 1) * params.limit);

  const items = await hydrate(db, rows, { content: params.include === "content", now });
  const totalPages = Math.max(1, Math.ceil(total / params.limit));
  return { items, meta: { page: params.page, limit: params.limit, total, totalPages, hasNext: params.page < totalPages } };
}

async function findRow(db: Db, idOrSlug: string, ctx: Ctx): Promise<PostRow | undefined> {
  const now = ctx.now ?? new Date();
  const match = UUID_RE.test(idOrSlug) ? eq(posts.id, idOrSlug) : eq(posts.slug, idOrSlug);
  const [row] = await db
    .select()
    .from(posts)
    .where(ctx.admin ? match : and(match, liveCondition(now)))
    .limit(1);
  return row;
}

export async function getPost(idOrSlug: string, ctx: Ctx = {}): Promise<PostDTO> {
  const db = await getDb();
  const row = await findRow(db, idOrSlug, ctx);
  if (!row) throw notFound("Post");
  const [dto] = await hydrate(db, [row], { content: true, now: ctx.now ?? new Date() });
  return dto;
}

export async function findPostBySlug(slug: string, ctx: Ctx = {}): Promise<PostDTO | null> {
  try {
    return await getPost(slug, ctx);
  } catch (e) {
    if (e instanceof AppError && e.status === 404) return null;
    throw e;
  }
}

/** Live posts that share tags (weighted 2) or the category (weighted 1) with the given post. */
export async function getRelatedPosts(post: Pick<PostDTO, "id" | "category" | "tags">, limit = 3, now = new Date()): Promise<PostDTO[]> {
  const db = await getDb();
  const tagIds = post.tags.map((t) => t.id);
  const related: (SQL | undefined)[] = [];
  if (post.category) related.push(eq(posts.categoryId, post.category.id));
  if (tagIds.length) related.push(inArray(posts.id, db.select({ id: postTags.postId }).from(postTags).where(inArray(postTags.tagId, tagIds))));
  if (related.length === 0) return [];
  const rows = await db
    .select()
    .from(posts)
    .where(and(liveCondition(now), ne(posts.id, post.id), or(...related)))
    .orderBy(desc(posts.publishedAt))
    .limit(30);
  const dtos = await hydrate(db, rows, { content: false, now });
  const score = (p: PostDTO) =>
    p.tags.filter((t) => tagIds.includes(t.id)).length * 2 + (post.category && p.category?.id === post.category.id ? 1 : 0);
  return dtos.sort((a, b) => score(b) - score(a)).slice(0, limit);
}

export async function listLiveSlugs(now = new Date()) {
  const db = await getDb();
  return db
    .select({ slug: posts.slug, updatedAt: posts.updatedAt, publishedAt: posts.publishedAt })
    .from(posts)
    .where(liveCondition(now))
    .orderBy(desc(posts.publishedAt));
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

function toDate(v: string | Date | null | undefined): Date | null {
  if (v === null || v === undefined || v === "") return null;
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) throw invalid("Invalid date");
  return d;
}

async function slugTaken(db: Pick<Db, "select">, slug: string, exceptId?: string) {
  const [row] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(exceptId ? and(eq(posts.slug, slug), ne(posts.id, exceptId)) : eq(posts.slug, slug))
    .limit(1);
  return !!row;
}

const slugConflict = (slug: string) => new AppError(409, "slug_taken", `Slug "${slug}" is already in use`, { slug });

function isUniqueError(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? "") + String((e as { cause?: { message?: string } })?.cause?.message ?? "");
  return /UNIQUE constraint failed/i.test(msg);
}

function snapshotOf(row: PostRow, tagIds: string[]): PostSnapshot {
  return {
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.coverImageUrl,
    status: row.status,
    publishedAt: iso(row.publishedAt),
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    authorId: row.authorId,
    categoryId: row.categoryId,
    tagIds,
    legacyUrl: row.legacyUrl,
  };
}

async function tagIdsOf(tx: Pick<Db, "select">, postId: string) {
  const rows = await tx.select({ id: postTags.tagId }).from(postTags).where(eq(postTags.postId, postId));
  return rows.map((r) => r.id).sort();
}

async function setTags(tx: Tx, postId: string, tagIds: string[]) {
  await tx.delete(postTags).where(eq(postTags.postId, postId));
  if (tagIds.length) await tx.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })));
}

function derived(content: string, excerpt: string | undefined) {
  return {
    contentHtml: renderMarkdown(content),
    readingMinutes: readingMinutes(content),
    excerpt: excerpt?.trim() ? excerpt.trim() : deriveExcerpt(content),
  };
}

export async function createPost(input: CreatePostInput, ctx: Ctx = {}): Promise<PostDTO> {
  const db = await getDb();
  const now = ctx.now ?? new Date();

  if (input.slug && (await slugTaken(db, input.slug))) throw slugConflict(input.slug);
  const slug = input.slug ?? (await uniqueSlug(input.title, (s) => slugTaken(db, s)));

  let publishedAt = toDate(input.publishedAt);
  if (input.status === "published" && !publishedAt) publishedAt = now;
  if (input.status === "scheduled" && !publishedAt) throw invalid("publishedAt is required for scheduled posts");

  try {
    const id = await db.transaction(async (tx) => {
      const authorId = input.authorId ?? (await defaultAuthorId(tx));
      if (input.authorId) {
        const [a] = await tx.select({ id: authors.id }).from(authors).where(eq(authors.id, input.authorId)).limit(1);
        if (!a) throw invalid("Unknown authorId", { authorId: input.authorId });
      }
      const category = input.category ? await resolveCategory(tx, input.category) : null;
      const tagRows = input.tags?.length ? await resolveTags(tx, input.tags) : [];
      const d = derived(input.content, input.excerpt);

      const [row] = await tx
        .insert(posts)
        .values({
          title: input.title,
          slug,
          content: input.content,
          ...d,
          coverImageUrl: input.coverImageUrl || null,
          status: input.status,
          publishedAt,
          seoTitle: input.seoTitle || null,
          seoDescription: input.seoDescription || null,
          authorId,
          categoryId: category?.id ?? null,
          legacyUrl: input.legacyUrl || null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      await setTags(tx, row.id, tagRows.map((t) => t.id));
      await tx.insert(postRevisions).values({
        postId: row.id,
        version: row.version,
        snapshot: JSON.stringify(snapshotOf(row, tagRows.map((t) => t.id).sort())),
        summary: "Created",
        createdAt: now,
      });
      return row.id;
    });
    return getPost(id, { admin: true, now });
  } catch (e) {
    if (isUniqueError(e)) throw slugConflict(slug);
    throw e;
  }
}

const SNAPSHOT_FIELDS: (keyof PostSnapshot)[] = [
  "title", "slug", "excerpt", "content", "coverImageUrl", "status", "publishedAt", "seoTitle", "seoDescription", "authorId", "categoryId", "tagIds", "legacyUrl",
];

function describeChange(before: PostSnapshot, after: PostSnapshot) {
  const changed = SNAPSHOT_FIELDS.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  return changed.length ? `Changed ${changed.join(", ")}` : "No field changes";
}

/** Apply a complete editable state to a post, bump its version and record a revision. Atomic. */
async function writeState(
  tx: Tx,
  row: PostRow,
  next: PostSnapshot,
  summary: string | null,
  expectedVersion: number,
  now: Date,
) {
  const d = derived(next.content, next.excerpt);
  const updated = await tx
    .update(posts)
    .set({
      title: next.title,
      slug: next.slug,
      content: next.content,
      ...d,
      coverImageUrl: next.coverImageUrl,
      status: next.status,
      publishedAt: toDate(next.publishedAt),
      seoTitle: next.seoTitle,
      seoDescription: next.seoDescription,
      authorId: next.authorId,
      categoryId: next.categoryId,
      legacyUrl: next.legacyUrl,
      updatedAt: now,
      version: expectedVersion + 1,
    })
    .where(and(eq(posts.id, row.id), eq(posts.version, expectedVersion)))
    .returning();
  if (updated.length === 0) {
    throw new AppError(409, "version_conflict", "The post was modified by someone else", { currentVersion: null });
  }
  await setTags(tx, row.id, next.tagIds);
  await tx.insert(postRevisions).values({
    postId: row.id,
    version: expectedVersion + 1,
    snapshot: JSON.stringify({ ...next, excerpt: d.excerpt, tagIds: [...next.tagIds].sort() }),
    summary: summary ?? "Updated",
    createdAt: now,
  });
}

async function loadForWrite(db: Pick<Db, "select">, id: string): Promise<PostRow> {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) throw notFound("Post");
  if (row.deletedAt) throw new AppError(409, "conflict", "Post is in the trash; restore it before editing");
  return row;
}

function versionConflict(current: number, supplied: number) {
  return new AppError(409, "version_conflict", `Version conflict: the post is at version ${current}, you sent ${supplied}. Reload and re-apply your changes.`, {
    currentVersion: current,
    yourVersion: supplied,
  });
}

export async function updatePost(
  id: string,
  input: UpdatePostInput,
  opts: { expectedVersion?: number } & Ctx = {},
): Promise<PostDTO> {
  const db = await getDb();
  const now = opts.now ?? new Date();
  const { version: bodyVersion, ...fields } = input;
  const expected = opts.expectedVersion ?? bodyVersion;

  try {
    await db.transaction(async (tx) => {
      const row = await loadForWrite(tx, id);
      if (expected !== undefined && expected !== row.version) throw versionConflict(row.version, expected);

      const beforeTags = await tagIdsOf(tx, row.id);
      const before = snapshotOf(row, beforeTags);
      const next: PostSnapshot = { ...before };

      if (fields.title !== undefined) next.title = fields.title;
      if (fields.slug !== undefined && fields.slug !== row.slug) {
        if (await slugTaken(tx, fields.slug, row.id)) throw slugConflict(fields.slug);
        next.slug = fields.slug;
      }
      if (fields.excerpt !== undefined) next.excerpt = fields.excerpt;
      if (fields.content !== undefined) next.content = fields.content;
      if (fields.coverImageUrl !== undefined) next.coverImageUrl = fields.coverImageUrl || null;
      if (fields.status !== undefined) next.status = fields.status;
      if (fields.publishedAt !== undefined) next.publishedAt = iso(toDate(fields.publishedAt));
      if (fields.seoTitle !== undefined) next.seoTitle = fields.seoTitle || null;
      if (fields.seoDescription !== undefined) next.seoDescription = fields.seoDescription || null;
      if (fields.legacyUrl !== undefined) next.legacyUrl = fields.legacyUrl || null;
      if (fields.authorId !== undefined) {
        if (fields.authorId) {
          const [a] = await tx.select({ id: authors.id }).from(authors).where(eq(authors.id, fields.authorId)).limit(1);
          if (!a) throw invalid("Unknown authorId", { authorId: fields.authorId });
        }
        next.authorId = fields.authorId ?? null;
      }
      if (fields.category !== undefined) next.categoryId = fields.category ? (await resolveCategory(tx, fields.category)).id : null;
      if (fields.tags !== undefined) next.tagIds = (await resolveTags(tx, fields.tags)).map((t) => t.id).sort();

      // Auto-derive the excerpt only when the author never wrote one (it was derived before).
      if (fields.excerpt === undefined && fields.content !== undefined && row.excerpt === deriveExcerpt(row.content)) {
        next.excerpt = "";
      }
      if (next.status === "published" && !next.publishedAt) next.publishedAt = now.toISOString();
      if (next.status === "scheduled" && !next.publishedAt) throw invalid("publishedAt is required for scheduled posts");

      const summary = describeChange(before, next);
      const d = derived(next.content, next.excerpt);
      next.excerpt = d.excerpt;
      await writeState(tx, row, next, summary, row.version, now);
    });
  } catch (e) {
    if (isUniqueError(e)) throw slugConflict(String(fields.slug ?? ""));
    throw e;
  }
  return getPost(id, { admin: true, now });
}

export async function softDeletePost(id: string, ctx: Ctx = {}): Promise<PostDTO> {
  const db = await getDb();
  const now = ctx.now ?? new Date();
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) throw notFound("Post");
  if (!row.deletedAt) await db.update(posts).set({ deletedAt: now }).where(eq(posts.id, id));
  return getPost(id, { admin: true, now });
}

export async function restorePost(id: string, ctx: Ctx = {}): Promise<PostDTO> {
  const db = await getDb();
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) throw notFound("Post");
  if (row.deletedAt) await db.update(posts).set({ deletedAt: null }).where(eq(posts.id, id));
  return getPost(id, { admin: true, now: ctx.now });
}

export async function hardDeletePost(id: string): Promise<void> {
  const db = await getDb();
  const [row] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) throw notFound("Post");
  await db.transaction(async (tx) => {
    await tx.delete(postTags).where(eq(postTags.postId, id));
    await tx.delete(postRevisions).where(eq(postRevisions.postId, id));
    await tx.delete(posts).where(eq(posts.id, id));
  });
}

// ---------------------------------------------------------------------------
// Revisions
// ---------------------------------------------------------------------------

function toRevision(r: typeof postRevisions.$inferSelect, withSnapshot: boolean): RevisionDTO {
  return {
    id: r.id,
    postId: r.postId,
    version: r.version,
    summary: r.summary,
    createdAt: r.createdAt.toISOString(),
    ...(withSnapshot ? { snapshot: JSON.parse(r.snapshot) as PostSnapshot } : {}),
  };
}

export async function listRevisions(postId: string): Promise<RevisionDTO[]> {
  const db = await getDb();
  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) throw notFound("Post");
  const rows = await db.select().from(postRevisions).where(eq(postRevisions.postId, postId)).orderBy(desc(postRevisions.version));
  return rows.map((r) => toRevision(r, false));
}

export async function getRevision(postId: string, version: number): Promise<RevisionDTO> {
  const db = await getDb();
  const [r] = await db
    .select()
    .from(postRevisions)
    .where(and(eq(postRevisions.postId, postId), eq(postRevisions.version, version)))
    .limit(1);
  if (!r) throw notFound("Revision");
  return toRevision(r, true);
}

/** Roll a post back to an earlier revision. History is preserved: this creates a NEW revision. */
export async function restoreRevision(
  postId: string,
  version: number,
  opts: { expectedVersion?: number } & Ctx = {},
): Promise<PostDTO> {
  const db = await getDb();
  const now = opts.now ?? new Date();
  const rev = await getRevision(postId, version);
  const snap = rev.snapshot!;

  await db.transaction(async (tx) => {
    const row = await loadForWrite(tx, postId);
    if (opts.expectedVersion !== undefined && opts.expectedVersion !== row.version) {
      throw versionConflict(row.version, opts.expectedVersion);
    }
    const next: PostSnapshot = { ...snap };
    // Slug may have been taken by another post since; keep the current one in that case.
    if (next.slug !== row.slug && (await slugTaken(tx, next.slug, row.id))) next.slug = row.slug;
    if (next.authorId) {
      const [a] = await tx.select({ id: authors.id }).from(authors).where(eq(authors.id, next.authorId)).limit(1);
      if (!a) next.authorId = row.authorId;
    }
    if (next.categoryId) {
      const [c] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.id, next.categoryId)).limit(1);
      if (!c) next.categoryId = null;
    }
    if (next.tagIds.length) {
      const existing = await tx.select({ id: tags.id }).from(tags).where(inArray(tags.id, next.tagIds));
      next.tagIds = existing.map((t) => t.id).sort();
    }
    await writeState(tx, row, next, `Restored from v${version}`, row.version, now);
  });
  return getPost(postId, { admin: true, now });
}
