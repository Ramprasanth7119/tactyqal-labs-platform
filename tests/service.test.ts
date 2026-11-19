import { describe, expect, it } from "vitest";
import { setupTempDb } from "./helpers";

setupTempDb();

const lib = async () => ({
  posts: await import("@/lib/blog/posts"),
  tax: await import("@/lib/blog/taxonomy"),
  md: await import("@/lib/blog/markdown"),
  slug: await import("@/lib/blog/slug"),
  val: await import("@/lib/blog/validation"),
  pub: await import("@/lib/blog/public"),
});

const create = async (title: string, extra: Record<string, unknown> = {}) => {
  const { posts, val } = await lib();
  return posts.createPost(val.createPostSchema.parse({ title, content: "Hello **world**", status: "published", ...extra }));
};

describe("slug + markdown helpers", () => {
  it("slugifies titles", async () => {
    const { slug } = await lib();
    expect(slug.slugify("Hello, World! It's 50 Ideas & more")).toBe("hello-world-its-50-ideas-and-more");
    expect(slug.slugify("Crème brûlée")).toBe("creme-brulee");
  });

  it("computes reading time (min 1, ~220 wpm) and sanitizes HTML", async () => {
    const { md } = await lib();
    expect(md.readingMinutes("short")).toBe(1);
    expect(md.readingMinutes(Array(660).fill("word").join(" "))).toBe(3);
    const html = md.renderMarkdown("# Hi\n\n<script>alert(1)</script><img src=x onerror=alert(1)>\n\n[x](javascript:alert(1)) [ok](https://a.com)");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('rel="noopener noreferrer nofollow"');
  });
});

describe("posts service", () => {
  it("creates a post with generated unique slugs, derived fields and revision 1", async () => {
    const { posts } = await lib();
    const a = await create("My First Post");
    const b = await create("My First Post");
    expect(a.slug).toBe("my-first-post");
    expect(b.slug).toBe("my-first-post-2");
    expect(a.version).toBe(1);
    expect(a.readingMinutes).toBe(1);
    expect(a.contentHtml).toContain("<strong>world</strong>");
    expect(a.excerpt).toBe("Hello world");
    expect(a.publishedAt).not.toBeNull();
    expect(a.author?.name).toBe("Tactyqal Team");
    const revs = await posts.listRevisions(a.id);
    expect(revs).toHaveLength(1);
    expect(revs[0].summary).toBe("Created");
  });

  it("rejects an explicit duplicate slug with 409 slug_taken", async () => {
    await create("Explicit", { slug: "explicit-slug" });
    await expect(create("Other", { slug: "explicit-slug" })).rejects.toMatchObject({ status: 409, code: "slug_taken" });
  });

  it("auto-creates category and tags by name and reuses them", async () => {
    const { tax } = await lib();
    const p = await create("Tagged", { category: "Growth", tags: ["Alpha", "beta", "alpha"] });
    expect(p.category?.slug).toBe("growth");
    expect(p.tags.map((t) => t.slug).sort()).toEqual(["alpha", "beta"]);
    await create("Tagged 2", { category: "growth", tags: ["ALPHA"] });
    const cats = await tax.listCategories();
    expect(cats.filter((c) => c.slug === "growth")).toHaveLength(1);
    expect(cats.find((c) => c.slug === "growth")?.postCount).toBe(2);
  });

  it("updates with optimistic concurrency and records revisions", async () => {
    const { posts } = await lib();
    const p = await create("Concurrent");
    const u1 = await posts.updatePost(p.id, { title: "Concurrent v2", version: 1 });
    expect(u1.version).toBe(2);
    expect(u1.slug).toBe("concurrent"); // slug stays stable on retitle
    await expect(posts.updatePost(p.id, { title: "stale", version: 1 })).rejects.toMatchObject({
      status: 409,
      code: "version_conflict",
      details: { currentVersion: 2 },
    });
    const revs = await posts.listRevisions(p.id);
    expect(revs.map((r) => r.version)).toEqual([2, 1]);
    expect(revs[0].summary).toContain("title");
  });

  it("restores an earlier revision as a new revision", async () => {
    const { posts } = await lib();
    const p = await create("Rollback", { content: "original body" });
    await posts.updatePost(p.id, { content: "changed body" });
    await posts.updatePost(p.id, { content: "changed again" });
    const restored = await posts.restoreRevision(p.id, 1);
    expect(restored.content).toBe("original body");
    expect(restored.version).toBe(4);
    const revs = await posts.listRevisions(p.id);
    expect(revs[0].summary).toBe("Restored from v1");
    expect(revs).toHaveLength(4);
  });

  it("soft deletes (hidden from public), restores, and hard deletes", async () => {
    const { posts } = await lib();
    const p = await create("Trash me");
    await posts.softDeletePost(p.id);
    await expect(posts.getPost(p.slug)).rejects.toMatchObject({ status: 404 });
    const admin = await posts.getPost(p.slug, { admin: true });
    expect(admin.deletedAt).not.toBeNull();
    await expect(posts.updatePost(p.id, { title: "nope here" })).rejects.toMatchObject({ status: 409 });
    const trash = await posts.listPosts({ status: "all", deleted: "only" }, { admin: true });
    expect(trash.items.map((i) => i.id)).toContain(p.id);
    await posts.restorePost(p.id);
    expect((await posts.getPost(p.slug)).id).toBe(p.id);
    await posts.hardDeletePost(p.id);
    await expect(posts.getPost(p.id, { admin: true })).rejects.toMatchObject({ status: 404 });
  });

  it("makes scheduled posts visible only after publishedAt, computed at query time", async () => {
    const { posts } = await lib();
    const at = new Date("2031-06-01T10:00:00Z");
    const p = await create("Scheduled one", { status: "scheduled", publishedAt: at.toISOString() });
    expect(p.status).toBe("scheduled");
    const before = new Date("2031-06-01T09:59:00Z");
    const after = new Date("2031-06-01T10:01:00Z");
    await expect(posts.getPost(p.slug, { now: before })).rejects.toMatchObject({ status: 404 });
    expect((await posts.listPosts({ q: "Scheduled one" }, { now: before })).items).toHaveLength(0);
    const live = await posts.getPost(p.slug, { now: after });
    expect(live.status).toBe("published"); // effective status
    expect((await posts.listPosts({ q: "Scheduled one" }, { now: after })).items).toHaveLength(1);
    // admin sees it as scheduled before the time
    const adminList = await posts.listPosts({ status: "scheduled" }, { admin: true, now: before });
    expect(adminList.items.map((i) => i.id)).toContain(p.id);
  });

  it("requires publishedAt for scheduled posts", async () => {
    const { val } = await lib();
    expect(val.createPostSchema.safeParse({ title: "Sched", status: "scheduled" }).success).toBe(false);
  });

  it("hides drafts from the public and shows them to admins", async () => {
    const { posts } = await lib();
    const d = await create("Secret draft", { status: "draft" });
    await expect(posts.getPost(d.slug)).rejects.toMatchObject({ status: 404 });
    await expect(posts.listPosts({ status: "draft" })).rejects.toMatchObject({ status: 401 });
    const list = await posts.listPosts({ status: "draft" }, { admin: true });
    expect(list.items.map((i) => i.id)).toContain(d.id);
  });

  it("searches title/excerpt/content, filters by tag/category, sorts and paginates", async () => {
    const { posts } = await lib();
    await create("Zebra care guide", { content: "Stripes are fascinating", category: "Animals", tags: ["zoo"] });
    await create("Quokka facts", { content: "The happiest animal alive", category: "Animals", tags: ["zoo", "cute"] });
    const q = await posts.listPosts({ q: "happiest alive" });
    expect(q.items.map((i) => i.title)).toEqual(["Quokka facts"]);
    expect((await posts.listPosts({ q: "100%_" })).items).toHaveLength(0); // LIKE wildcards are escaped
    expect((await posts.listPosts({ tag: "cute" })).items).toHaveLength(1);
    expect((await posts.listPosts({ category: "animals" })).meta.total).toBe(2);
    const sorted = await posts.listPosts({ category: "animals", sort: "title" });
    expect(sorted.items.map((i) => i.title)).toEqual(["Quokka facts", "Zebra care guide"]);
    const page = await posts.listPosts({ category: "animals", limit: 1, page: 2, sort: "title" });
    expect(page.items).toHaveLength(1);
    expect(page.meta).toMatchObject({ page: 2, total: 2, totalPages: 2, hasNext: false });
    expect(page.items[0].content).toBeUndefined();
  });

  it("finds related posts by shared tags", async () => {
    const { posts } = await lib();
    const z = await posts.getPost("zebra-care-guide");
    const related = await posts.getRelatedPosts(z);
    expect(related[0].title).toBe("Quokka facts");
  });

  it("getLatestPosts returns the homepage contract shape", async () => {
    const { pub } = await lib();
    const latest = await pub.getLatestPosts(2);
    expect(latest).toHaveLength(2);
    expect(Object.keys(latest[0]).sort()).toEqual([
      "author", "category", "coverImageUrl", "excerpt", "publishedAt", "readingMinutes", "slug", "tags", "title",
    ]);
  });
});
