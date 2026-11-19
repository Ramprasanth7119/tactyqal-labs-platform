import { beforeEach, describe, expect, it } from "vitest";
import { call, setupTempDb } from "./helpers";

setupTempDb();

const routes = async () => ({
  posts: await import("@/app/api/v1/posts/route"),
  post: await import("@/app/api/v1/posts/[id]/route"),
  restore: await import("@/app/api/v1/posts/[id]/restore/route"),
  revs: await import("@/app/api/v1/posts/[id]/revisions/route"),
  rev: await import("@/app/api/v1/posts/[id]/revisions/[rev]/route"),
  revRestore: await import("@/app/api/v1/posts/[id]/revisions/[rev]/restore/route"),
  cats: await import("@/app/api/v1/categories/route"),
  tags: await import("@/app/api/v1/tags/route"),
  authors: await import("@/app/api/v1/authors/route"),
  login: await import("@/app/api/v1/auth/login/route"),
  me: await import("@/app/api/v1/auth/me/route"),
  health: await import("@/app/api/v1/health/route"),
  preview: await import("@/app/api/v1/preview/route"),
  openapi: await import("@/app/api/v1/openapi.json/route"),
});

describe("REST API", () => {
  beforeEach(async () => {
    (await import("@/lib/auth/rate-limit")).resetRateLimits();
  });

  it("GET /health", async () => {
    const r = await routes();
    const res = await call(r.health.GET, "GET", "/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
  });

  it("serves an OpenAPI 3.1 document", async () => {
    const r = await routes();
    const spec = await r.openapi.GET().json();
    expect(spec.openapi).toBe("3.1.0");
    expect(Object.keys(spec.paths)).toContain("/posts/{id}/revisions/{rev}/restore");
  });

  it("rejects writes without credentials (401) and with a wrong key", async () => {
    const r = await routes();
    const none = await call(r.posts.POST, "POST", "/api/v1/posts", { body: { title: "No auth" } });
    expect(none.status).toBe(401);
    expect(none.body.error.code).toBe("unauthorized");
    expect(none.headers.get("www-authenticate")).toContain("Bearer");
    const wrong = await call(r.posts.POST, "POST", "/api/v1/posts", { body: { title: "Bad key" }, auth: "Bearer nope" });
    expect(wrong.status).toBe(401);
  });

  it("validates input with 422 and field details; 400 for malformed JSON", async () => {
    const r = await routes();
    const bad = await call(r.posts.POST, "POST", "/api/v1/posts", { body: { title: "x", status: "weird", extra: 1 }, auth: true });
    expect(bad.status).toBe(422);
    expect(bad.body.error.code).toBe("validation_failed");
    expect(Array.isArray(bad.body.error.details)).toBe(true);
    expect(bad.body.error.details.some((d: { path: string }) => d.path === "title")).toBe(true);
    const malformed = await call(r.posts.POST, "POST", "/api/v1/posts", { body: "{nope", auth: true });
    expect(malformed.status).toBe(400);
  });

  it("full CRUD lifecycle with envelope, ETag and If-Match", async () => {
    const r = await routes();
    const created = await call(r.posts.POST, "POST", "/api/v1/posts", {
      auth: true,
      body: { title: "API lifecycle", content: "# Body\n\ntext", status: "published", category: "Engineering", tags: ["api"] },
    });
    expect(created.status).toBe(201);
    expect(created.body.meta).toEqual({});
    const post = created.body.data;
    expect(created.headers.get("location")).toBe(`/api/v1/posts/${post.id}`);
    expect(created.headers.get("etag")).toBe('"1"');

    const bySlug = await call(r.post.GET, "GET", "/x", { params: { id: post.slug } });
    expect(bySlug.status).toBe(200);
    expect(bySlug.headers.get("cache-control")).toContain("s-maxage");
    const byId = await call(r.post.GET, "GET", "/x", { params: { id: post.id } });
    expect(byId.body.data.id).toBe(post.id);

    const list = await call(r.posts.GET, "GET", "/api/v1/posts?q=lifecycle&limit=5");
    expect(list.status).toBe(200);
    expect(list.body.meta).toMatchObject({ page: 1, limit: 5, total: 1 });
    expect(list.body.data[0].content).toBeUndefined();

    const patched = await call(r.post.PATCH, "PATCH", "/x", {
      auth: true, params: { id: post.id }, headers: { "if-match": '"1"' }, body: { title: "API lifecycle updated" },
    });
    expect(patched.status).toBe(200);
    expect(patched.body.data.version).toBe(2);
    const stale = await call(r.post.PATCH, "PATCH", "/x", {
      auth: true, params: { id: post.id }, headers: { "if-match": '"1"' }, body: { title: "stale write" },
    });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe("version_conflict");
    const staleBody = await call(r.post.PATCH, "PATCH", "/x", { auth: true, params: { id: post.id }, body: { title: "stale body", version: 1 } });
    expect(staleBody.status).toBe(409);

    const revs = await call(r.revs.GET, "GET", "/x", { auth: true, params: { id: post.id } });
    expect(revs.body.data.map((x: { version: number }) => x.version)).toEqual([2, 1]);
    expect((await call(r.revs.GET, "GET", "/x", { params: { id: post.id } })).status).toBe(401);
    const rev1 = await call(r.rev.GET, "GET", "/x", { auth: true, params: { id: post.id, rev: "1" } });
    expect(rev1.body.data.snapshot.title).toBe("API lifecycle");
    const back = await call(r.revRestore.POST, "POST", "/x", { auth: true, params: { id: post.id, rev: "1" } });
    expect(back.body.data.title).toBe("API lifecycle");
    expect(back.body.data.version).toBe(3);
    expect((await call(r.revRestore.POST, "POST", "/x", { auth: true, params: { id: post.id, rev: "99" } })).status).toBe(404);

    const del = await call(r.post.DELETE, "DELETE", "/x", { auth: true, params: { id: post.id } });
    expect(del.status).toBe(200);
    expect(del.body.data.deletedAt).not.toBeNull();
    expect((await call(r.post.GET, "GET", "/x", { params: { id: post.slug } })).status).toBe(404);
    expect((await call(r.restore.POST, "POST", "/x", { auth: true, params: { id: post.id } })).body.data.deletedAt).toBeNull();
    expect((await call(r.post.DELETE, "DELETE", "/x?hard=true", { params: { id: post.id } })).status).toBe(401);
    const hard = await call(r.post.DELETE, "DELETE", "/x?hard=true", { auth: true, params: { id: post.id } });
    expect(hard.body.data).toMatchObject({ deleted: true, hard: true });
    expect((await call(r.post.GET, "GET", "/x", { auth: true, params: { id: post.id } })).status).toBe(404);
  });

  it("only exposes drafts / status filters to admins", async () => {
    const r = await routes();
    await call(r.posts.POST, "POST", "/api/v1/posts", { auth: true, body: { title: "Hidden draft", status: "draft" } });
    expect((await call(r.posts.GET, "GET", "/api/v1/posts?status=draft")).status).toBe(401);
    const admin = await call(r.posts.GET, "GET", "/api/v1/posts?status=draft", { auth: true });
    expect(admin.status).toBe(200);
    expect(admin.body.data.length).toBeGreaterThan(0);
    expect(admin.headers.get("cache-control")).toBe("private, no-store");
    expect((await call(r.posts.GET, "GET", "/api/v1/posts?sort=bogus")).status).toBe(422);
  });

  it("404s for unknown posts", async () => {
    const r = await routes();
    const res = await call(r.post.GET, "GET", "/x", { params: { id: "does-not-exist" } });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("taxonomy endpoints: list public, create admin-only, duplicate slug 409", async () => {
    const r = await routes();
    expect((await call(r.cats.POST, "POST", "/x", { body: { name: "Nope" } })).status).toBe(401);
    const c = await call(r.cats.POST, "POST", "/x", { auth: true, body: { name: "Design Systems" } });
    expect(c.status).toBe(201);
    expect(c.body.data.slug).toBe("design-systems");
    expect((await call(r.cats.POST, "POST", "/x", { auth: true, body: { name: "Other", slug: "design-systems" } })).status).toBe(409);
    expect((await call(r.cats.GET, "GET", "/x")).body.data.some((x: { slug: string }) => x.slug === "design-systems")).toBe(true);
    expect((await call(r.tags.POST, "POST", "/x", { auth: true, body: { name: "Rust" } })).status).toBe(201);
    expect((await call(r.tags.GET, "GET", "/x")).status).toBe(200);
    const a = await call(r.authors.POST, "POST", "/x", { auth: true, body: { name: "Ada Writer", email: "ada@example.com" } });
    expect(a.status).toBe(201);
    const publicAuthors = await call(r.authors.GET, "GET", "/x");
    expect(JSON.stringify(publicAuthors.body)).not.toContain("ada@example.com");
  });

  it("login sets an httpOnly signed cookie that authorises writes; wrong password 401; rate limited", async () => {
    const r = await routes();
    const bad = await call(r.login.POST, "POST", "/x", { body: { password: "wrong" } });
    expect(bad.status).toBe(401);
    const ok = await call(r.login.POST, "POST", "/x", { body: { password: "pw-for-tests" } });
    expect(ok.status).toBe(200);
    const cookie = ok.headers.get("set-cookie")!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    const pair = cookie.split(";")[0];
    const me = await call(r.me.GET, "GET", "/x", { headers: { cookie: pair } });
    expect(me.body.data.authenticated).toBe(true);
    const tampered = await call(r.me.GET, "GET", "/x", { headers: { cookie: pair.slice(0, -2) + "xx" } });
    expect(tampered.body.data.authenticated).toBe(false);
    const created = await call(r.posts.POST, "POST", "/api/v1/posts", { headers: { cookie: pair }, body: { title: "Cookie auth" } });
    expect(created.status).toBe(201);
    const prev = await call(r.preview.POST, "POST", "/x", { headers: { cookie: pair }, body: { markdown: "**hi**" } });
    expect(prev.body.data.html).toContain("<strong>hi</strong>");

    for (let i = 0; i < 10; i++) await call(r.login.POST, "POST", "/x", { body: { password: "wrong" } });
    const limited = await call(r.login.POST, "POST", "/x", { body: { password: "pw-for-tests" } });
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBeTruthy();
  });

  it("expired sessions are rejected", async () => {
    const { createSessionToken, verifySessionToken } = await import("@/lib/auth/session");
    const token = (await createSessionToken(Date.now() - 8 * 24 * 3600 * 1000))!;
    expect(await verifySessionToken(token)).toBe(false);
    expect(await verifySessionToken(await createSessionToken())).toBe(true);
  });
});
