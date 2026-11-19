import { and, asc, count, eq, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db/client";
import { authors, categories, posts, postTags, tags } from "@/lib/db/schema";
import { AppError } from "./errors";
import { slugify, uniqueSlug } from "./slug";
import type { createAuthorSchema, createTermSchema } from "./validation";
import type { z } from "zod";

/** Published/scheduled and its go-live time has passed (ignores the trash flag). */
export function visibleCondition(now: Date) {
  return and(inArray(posts.status, ["published", "scheduled"]), isNotNull(posts.publishedAt), lte(posts.publishedAt, now));
}

/** A post is publicly visible when it is not trashed and is visible per the rule above. */
export function liveCondition(now: Date) {
  return and(isNull(posts.deletedAt), visibleCondition(now));
}

type Tx = Pick<Db, "select" | "insert">;

type TermTable = typeof categories | typeof tags;

/** Resolve an id / slug / name to a term row, creating it when the reference is a new name. */
async function resolveTerm(tx: Tx, table: TermTable, ref: string) {
  const trimmed = ref.trim();
  const slug = slugify(trimmed);
  const [found] = await tx
    .select()
    .from(table)
    .where(or(eq(table.id, trimmed), eq(table.slug, slug), sql`lower(${table.name}) = ${trimmed.toLowerCase()}`))
    .limit(1);
  if (found) return found;
  if (!slug) throw new AppError(422, "validation_failed", `"${ref}" is not a valid name`);
  const [created] = await tx.insert(table).values({ name: trimmed, slug }).returning();
  return created;
}

export const resolveCategory = (tx: Tx, ref: string) => resolveTerm(tx, categories, ref);
export const resolveTag = (tx: Tx, ref: string) => resolveTerm(tx, tags, ref);

export async function resolveTags(tx: Tx, refs: string[]) {
  const out = new Map<string, typeof tags.$inferSelect>();
  for (const ref of refs) {
    const tag = await resolveTag(tx, ref);
    out.set(tag.id, tag);
  }
  return [...out.values()];
}

export async function listCategories(now = new Date()) {
  const db = await getDb();
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      postCount: count(posts.id),
    })
    .from(categories)
    .leftJoin(posts, and(eq(posts.categoryId, categories.id), liveCondition(now)))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));
}

export async function listTags(now = new Date()) {
  const db = await getDb();
  return db
    .select({ id: tags.id, name: tags.name, slug: tags.slug, postCount: count(posts.id) })
    .from(tags)
    .leftJoin(postTags, eq(postTags.tagId, tags.id))
    .leftJoin(posts, and(eq(posts.id, postTags.postId), liveCondition(now)))
    .groupBy(tags.id)
    .orderBy(asc(tags.name));
}

export async function listAuthors() {
  const db = await getDb();
  return db.select().from(authors).orderBy(asc(authors.name));
}

export async function createCategory(input: z.infer<typeof createTermSchema>) {
  const db = await getDb();
  return createTerm(db, categories, input);
}

export async function createTag(input: z.infer<typeof createTermSchema>) {
  const db = await getDb();
  return createTerm(db, tags, input);
}

async function createTerm(db: Db, table: TermTable, input: z.infer<typeof createTermSchema>) {
  const slug = input.slug ?? (await uniqueSlug(input.name, async (s) => !!(await findBySlug(db, table, s))));
  if (input.slug && (await findBySlug(db, table, slug))) {
    throw new AppError(409, "slug_taken", `Slug "${slug}" is already in use`);
  }
  const values: Record<string, unknown> = { name: input.name, slug };
  if (table === categories) values.description = input.description ?? null;
  const [row] = await db.insert(table).values(values as typeof categories.$inferInsert).returning();
  return row;
}

async function findBySlug(db: Db, table: TermTable, slug: string) {
  const [row] = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug)).limit(1);
  return row;
}

export async function createAuthor(input: z.infer<typeof createAuthorSchema>) {
  const db = await getDb();
  const taken = async (s: string) => !!(await db.select({ id: authors.id }).from(authors).where(eq(authors.slug, s)).limit(1))[0];
  if (input.slug && (await taken(input.slug))) {
    throw new AppError(409, "slug_taken", `Slug "${input.slug}" is already in use`);
  }
  const slug = input.slug ?? (await uniqueSlug(input.name, taken));
  const [row] = await db
    .insert(authors)
    .values({
      name: input.name,
      slug,
      email: input.email ?? null,
      bio: input.bio ?? null,
      avatarUrl: input.avatarUrl || null,
    })
    .returning();
  return row;
}

/** The default author used when a post is created without one. Created on demand. */
export async function defaultAuthorId(tx: Tx): Promise<string> {
  const [first] = await tx.select({ id: authors.id }).from(authors).orderBy(asc(authors.createdAt)).limit(1);
  if (first) return first.id;
  const [created] = await tx.insert(authors).values({ name: "Tactyqal Team", slug: "tactyqal-team" }).returning();
  return created.id;
}
