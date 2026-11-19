// WordPress -> Tactyqal blog importer. Supports WXR export files and the WP REST API.
// Idempotent: posts are matched by slug, so re-running updates instead of duplicating.
import { XMLParser } from "fast-xml-parser";
import { getDb } from "@/lib/db/client";
import { authors } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { createPost, findPostBySlug, updatePost } from "./posts";
import { createAuthor } from "./taxonomy";
import { slugify } from "./slug";
import type { PostStatus } from "./types";

export type ImportedPost = {
  title: string;
  slug: string;
  content: string; // markdown
  excerpt: string;
  status: PostStatus;
  publishedAt: string | null;
  author: string | null;
  category: string | null;
  tags: string[];
  legacyUrl: string | null;
  coverImageUrl: string | null;
};

export type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  failed: { slug: string; error: string }[];
};

// ---------------------------------------------------------------------------
// HTML -> Markdown (small, dependency-free; unknown tags pass through and are sanitized on render)
// ---------------------------------------------------------------------------

const ENTITIES: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&#039;": "'", "&apos;": "'", "&nbsp;": " " };

function decodeEntities(s: string) {
  return s
    .replace(/&(amp|quot|apos|nbsp|#039);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (m, n) => {
      const code = Number(n);
      return code === 60 || code === 62 ? m : String.fromCodePoint(code); // keep < and > escaped
    });
}

export function htmlToMarkdown(html: string): string {
  let s = html.replace(/\r\n/g, "\n").replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<pre[^>]*>\s*(?:<code[^>]*>)?([\s\S]*?)(?:<\/code>)?\s*<\/pre>/gi, (_m, code: string) => {
    const plain = decodeEntities(code.replace(/<[^>]+>/g, "")).replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    return `\n\n\`\`\`\n${plain.trim()}\n\`\`\`\n\n`;
  });
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, l: string, t: string) => `\n\n${"#".repeat(Number(l))} ${t.replace(/<[^>]+>/g, "").trim()}\n\n`);
  s = s.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = /src=["']([^"']+)["']/i.exec(tag)?.[1];
    const alt = /alt=["']([^"']*)["']/i.exec(tag)?.[1] ?? "";
    return src ? `![${alt}](${src})` : "";
  });
  s = s.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, text: string) => `[${text.replace(/<[^>]+>/g, "").trim() || href}](${href})`);
  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**");
  s = s.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*");
  s = s.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");
  s = s.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner: string) => {
    let i = 0;
    return `\n\n${inner.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_x, li: string) => `${++i}. ${li.trim()}\n`)}\n`;
  });
  s = s.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner: string) =>
    `\n\n${inner.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_x, li: string) => `- ${li.trim()}\n`)}\n`);
  s = s.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, q: string) =>
    `\n\n${q.replace(/<\/?p[^>]*>/gi, "").trim().split("\n").map((l) => `> ${l}`).join("\n")}\n\n`);
  s = s.replace(/<br\s*\/?>/gi, "  \n").replace(/<hr\s*\/?>/gi, "\n\n---\n\n");
  s = s.replace(/<\/p>/gi, "\n\n").replace(/<p\b[^>]*>/gi, "").replace(/<\/?(div|span|figure|figcaption)\b[^>]*>/gi, "\n");
  s = decodeEntities(s);
  return s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ---------------------------------------------------------------------------
// WXR (WordPress eXtended RSS) export
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;
const text = (v: unknown): string => {
  if (v === undefined || v === null) return "";
  if (typeof v === "object") return text((v as Json)["#text"]);
  return String(v);
};
const arr = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

function wpDate(gmt: string, local: string): string | null {
  const raw = gmt && !gmt.startsWith("0000") ? gmt : "";
  if (raw) return new Date(raw.replace(" ", "T") + "Z").toISOString();
  if (local && !local.startsWith("0000")) return new Date(local.replace(" ", "T") + "Z").toISOString();
  return null;
}

function mapStatus(wp: string, date: string | null): PostStatus | null {
  switch (wp) {
    case "publish": return "published";
    case "future": return date ? "scheduled" : "draft";
    case "draft": case "pending": case "private": case "auto-draft": return "draft";
    default: return null; // trash, inherit, ...
  }
}

export function parseWxr(xml: string): ImportedPost[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: false,
    isArray: (name) => name === "item" || name === "category" || name === "wp:postmeta" || name === "wp:author",
  });
  const doc = parser.parse(xml) as Json;
  const channel = ((doc.rss as Json | undefined)?.channel ?? undefined) as Json | undefined;
  if (!channel) throw new Error("Not a WordPress WXR export: missing <rss><channel>");

  const authorNames = new Map<string, string>();
  for (const a of arr(channel["wp:author"] as Json[] | undefined)) {
    authorNames.set(text(a["wp:author_login"]), text(a["wp:author_display_name"]) || text(a["wp:author_login"]));
  }

  const items = arr(channel.item as Json[] | undefined);
  const attachments = new Map<string, string>();
  for (const it of items) {
    if (text(it["wp:post_type"]) === "attachment") attachments.set(text(it["wp:post_id"]), text(it["wp:attachment_url"]));
  }

  const out: ImportedPost[] = [];
  for (const it of items) {
    if (text(it["wp:post_type"]) !== "post") continue;
    const date = wpDate(text(it["wp:post_date_gmt"]), text(it["wp:post_date"]));
    const status = mapStatus(text(it["wp:status"]), date);
    if (!status) continue;

    const terms = arr(it.category as (string | Json)[] | undefined);
    const categories = terms.filter((t) => typeof t === "object" && (t as Json)["@_domain"] === "category").map(text);
    const tagNames = terms.filter((t) => typeof t === "object" && (t as Json)["@_domain"] === "post_tag").map(text);

    let cover: string | null = null;
    for (const m of arr(it["wp:postmeta"] as Json[] | undefined)) {
      if (text(m["wp:meta_key"]) === "_thumbnail_id") cover = attachments.get(text(m["wp:meta_value"])) ?? null;
    }

    const title = text(it.title).trim();
    const creator = text(it["dc:creator"]);
    out.push({
      title: title || "Untitled",
      slug: text(it["wp:post_name"]) || slugify(title) || `post-${text(it["wp:post_id"])}`,
      content: htmlToMarkdown(text(it["content:encoded"])),
      excerpt: htmlToMarkdown(text(it["excerpt:encoded"])).replace(/\s+/g, " ").trim(),
      status,
      publishedAt: status === "draft" ? null : date,
      author: authorNames.get(creator) ?? (creator || null),
      category: categories[0] ?? null,
      tags: tagNames,
      legacyUrl: text(it.link) || null,
      coverImageUrl: cover,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// WP REST API (wp-json/wp/v2/posts?_embed)
// ---------------------------------------------------------------------------

type WpRestPost = {
  slug: string;
  status: string;
  link?: string;
  date_gmt?: string;
  date?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  excerpt?: { rendered?: string };
  _embedded?: {
    author?: { name?: string }[];
    "wp:featuredmedia"?: { source_url?: string }[];
    "wp:term"?: { taxonomy: string; name: string }[][];
  };
};

export function mapWpRestPost(p: WpRestPost): ImportedPost | null {
  const date = p.date_gmt ? new Date(p.date_gmt + (p.date_gmt.endsWith("Z") ? "" : "Z")).toISOString() : null;
  const status = mapStatus(p.status, date);
  if (!status) return null;
  const terms = (p._embedded?.["wp:term"] ?? []).flat();
  const title = htmlToMarkdown(p.title?.rendered ?? "").replace(/\s+/g, " ");
  return {
    title: title || "Untitled",
    slug: p.slug || slugify(title),
    content: htmlToMarkdown(p.content?.rendered ?? ""),
    excerpt: htmlToMarkdown(p.excerpt?.rendered ?? "").replace(/\s+/g, " ").trim(),
    status,
    publishedAt: date,
    author: p._embedded?.author?.[0]?.name ?? null,
    category: terms.find((t) => t.taxonomy === "category")?.name ?? null,
    tags: terms.filter((t) => t.taxonomy === "post_tag").map((t) => t.name),
    legacyUrl: p.link ?? null,
    coverImageUrl: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null,
  };
}

export async function fetchWpRestPosts(baseUrl: string, fetchImpl: typeof fetch = fetch): Promise<ImportedPost[]> {
  const base = baseUrl.replace(/\/+$/, "");
  const out: ImportedPost[] = [];
  let totalPages = 1;
  for (let page = 1; page <= totalPages && page <= 200; page++) {
    const res = await fetchImpl(`${base}/wp/v2/posts?per_page=100&page=${page}&_embed=1&status=publish`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`WordPress REST API returned HTTP ${res.status} for ${base}/wp/v2/posts (page ${page})`);
    totalPages = Number(res.headers.get("x-wp-totalpages") ?? 1) || 1;
    for (const p of (await res.json()) as WpRestPost[]) {
      const mapped = mapWpRestPost(p);
      if (mapped) out.push(mapped);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Persist
// ---------------------------------------------------------------------------

async function authorIdFor(name: string | null): Promise<string | undefined> {
  if (!name) return undefined;
  const db = await getDb();
  const [found] = await db.select({ id: authors.id }).from(authors).where(sql`lower(${authors.name}) = ${name.toLowerCase()}`).limit(1);
  if (found) return found.id;
  return (await createAuthor({ name })).id;
}

export async function importPosts(items: ImportedPost[], opts: { dryRun?: boolean; log?: (m: string) => void } = {}): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, failed: [] };
  for (const item of items) {
    try {
      const existing = await findPostBySlug(item.slug, { admin: true });
      const fields = {
        title: item.title,
        excerpt: item.excerpt || undefined,
        content: item.content,
        status: item.status,
        publishedAt: item.publishedAt,
        coverImageUrl: item.coverImageUrl,
        legacyUrl: item.legacyUrl,
        category: item.category,
        tags: item.tags,
      };
      if (existing) {
        const sameTags = JSON.stringify(existing.tags.map((t) => t.name).sort()) === JSON.stringify([...item.tags].sort());
        const unchanged =
          existing.title === item.title &&
          existing.content === item.content &&
          existing.status === item.status &&
          existing.publishedAt === item.publishedAt &&
          sameTags &&
          (existing.category?.name ?? null) === item.category;
        if (unchanged || existing.deletedAt) {
          result.skipped++;
          continue;
        }
        if (!opts.dryRun) await updatePost(existing.id, fields);
        result.updated++;
        opts.log?.(`updated  ${item.slug}`);
      } else {
        if (!opts.dryRun) {
          await createPost({ ...fields, slug: item.slug, authorId: await authorIdFor(item.author) });
        }
        result.created++;
        opts.log?.(`created  ${item.slug}`);
      }
    } catch (e) {
      result.failed.push({ slug: item.slug, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return result;
}
