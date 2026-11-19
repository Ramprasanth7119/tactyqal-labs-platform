import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { setupTempDb } from "./helpers";

setupTempDb();

const xml = () => fs.readFileSync(path.join(process.cwd(), "scripts/fixtures/sample-wordpress-export.xml"), "utf8");

describe("WordPress importer", () => {
  it("parses a WXR export: posts only, statuses mapped, taxonomy and cover resolved", async () => {
    const { parseWxr } = await import("@/lib/blog/import-wordpress");
    const items = parseWxr(xml());
    expect(items.map((i) => i.slug)).toEqual([
      "why-every-student-founder-needs-a-prototype",
      "draft-notes-on-pricing",
      "launching-in-the-future",
    ]);
    const [a, draft, future] = items;
    expect(a.status).toBe("published");
    expect(a.publishedAt).toBe("2024-02-10T04:30:00.000Z");
    expect(a.author).toBe("Priya Editor");
    expect(a.category).toBe("Entrepreneurship");
    expect(a.tags).toEqual(["prototyping", "students"]);
    expect(a.coverImageUrl).toBe("https://old.example.com/wp-content/uploads/cover.jpg");
    expect(a.content).toContain("**prototype**");
    expect(a.content).toContain("[our guide](https://example.com/guide)");
    expect(a.content).toContain("## Three quick wins");
    expect(a.content).toContain("- Sketch the main screen");
    expect(a.content).toContain("Tom & Jerry");
    expect(a.content).not.toContain("wp:paragraph");
    expect(draft.status).toBe("draft");
    expect(draft.publishedAt).toBeNull();
    expect(future.status).toBe("scheduled");
    expect(future.content).toContain("1. Plan");
    expect(future.content).toContain("```\nnpm run build\n```");
  });

  it("imports into the database idempotently and sanitizes scripts on render", async () => {
    const { parseWxr, importPosts } = await import("@/lib/blog/import-wordpress");
    const { getPost, listPosts } = await import("@/lib/blog/posts");
    const items = parseWxr(xml());

    const first = await importPosts(items);
    expect(first).toMatchObject({ created: 3, updated: 0, skipped: 0 });
    expect(first.failed).toEqual([]);

    const second = await importPosts(items);
    expect(second).toMatchObject({ created: 0, updated: 0, skipped: 3 });
    expect((await listPosts({ status: "all" }, { admin: true })).meta.total).toBe(3);

    const post = await getPost("why-every-student-founder-needs-a-prototype");
    expect(post.author?.name).toBe("Priya Editor");
    expect(post.legacyUrl).toContain("old.example.com");
    expect(post.contentHtml).not.toContain("<script");
    expect(post.excerpt).toBe("Prototypes beat pitch decks.");

    // a changed source updates the post (and records a revision) instead of duplicating it
    const changed = items.map((i) => (i.slug === post.slug ? { ...i, title: "Retitled in WordPress" } : i));
    const third = await importPosts(changed);
    expect(third).toMatchObject({ created: 0, updated: 1, skipped: 2 });
    expect((await getPost(post.slug)).title).toBe("Retitled in WordPress");

    // scheduled post from WP is hidden until its date
    await expect(getPost("launching-in-the-future")).rejects.toMatchObject({ status: 404 });
  });

  it("maps WP REST API posts (with _embed)", async () => {
    const { mapWpRestPost, fetchWpRestPosts } = await import("@/lib/blog/import-wordpress");
    const sample = {
      slug: "rest-post",
      status: "publish",
      link: "https://wp.example.com/rest-post/",
      date_gmt: "2025-01-02T03:04:05",
      title: { rendered: "REST &amp; Friends" },
      content: { rendered: "<p>Hello <em>there</em></p>" },
      excerpt: { rendered: "<p>Short</p>" },
      _embedded: {
        author: [{ name: "Rest Author" }],
        "wp:featuredmedia": [{ source_url: "https://wp.example.com/i.jpg" }],
        "wp:term": [[{ taxonomy: "category", name: "News" }], [{ taxonomy: "post_tag", name: "wp" }]],
      },
    };
    const mapped = mapWpRestPost(sample)!;
    expect(mapped).toMatchObject({
      title: "REST & Friends",
      slug: "rest-post",
      status: "published",
      author: "Rest Author",
      category: "News",
      tags: ["wp"],
      publishedAt: "2025-01-02T03:04:05.000Z",
      coverImageUrl: "https://wp.example.com/i.jpg",
    });
    expect(mapped.content).toBe("Hello *there*");

    const fakeFetch = (async (url: string) => {
      const page = Number(new URL(url).searchParams.get("page"));
      return new Response(JSON.stringify(page === 1 ? [sample] : [{ ...sample, slug: "rest-two" }]), {
        status: 200,
        headers: { "x-wp-totalpages": "2" },
      });
    }) as unknown as typeof fetch;
    const all = await fetchWpRestPosts("https://wp.example.com/wp-json/", fakeFetch);
    expect(all.map((p) => p.slug)).toEqual(["rest-post", "rest-two"]);
    await expect(
      fetchWpRestPosts("https://wp.example.com/wp-json", (async () => new Response("boom", { status: 500 })) as unknown as typeof fetch),
    ).rejects.toThrow(/HTTP 500/);
  });
});
