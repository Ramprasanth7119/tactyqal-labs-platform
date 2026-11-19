"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PostDTO, RevisionDTO } from "@/lib/blog/types";
import { api, ApiError, fmtDateTime } from "./api";
import { StatusBadge } from "./status-badge";

type Term = { id: string; name: string; slug: string };
type Form = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  status: "draft" | "published" | "scheduled" | "archived";
  publishedAt: string; // datetime-local value
  seoTitle: string;
  seoDescription: string;
  category: string;
  tags: string; // comma separated
  authorId: string;
};

const EMPTY: Form = {
  title: "", slug: "", excerpt: "", content: "", coverImageUrl: "", status: "draft", publishedAt: "",
  seoTitle: "", seoDescription: "", category: "", tags: "", authorId: "",
};

const pad = (n: number) => String(n).padStart(2, "0");
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromPost(p: PostDTO): Form {
  return {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content ?? "",
    coverImageUrl: p.coverImageUrl ?? "",
    status: p.status,
    publishedAt: toLocalInput(p.publishedAt),
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    category: p.category?.name ?? "",
    tags: p.tags.map((t) => t.name).join(", "),
    authorId: p.author?.id ?? "",
  };
}

const parseTags = (s: string) => [...new Set(s.split(",").map((t) => t.trim()).filter(Boolean))];

export function PostEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [post, setPost] = useState<PostDTO | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [initial, setInitial] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error" | "conflict"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Term[]>([]);
  const [tagList, setTagList] = useState<Term[]>([]);
  const [authors, setAuthors] = useState<Term[]>([]);
  const [revisions, setRevisions] = useState<RevisionDTO[]>([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewMinutes, setPreviewMinutes] = useState(1);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const previewSeq = useRef(0);

  const apply = useCallback((p: PostDTO) => {
    setPost(p);
    const f = fromPost(p);
    setForm(f);
    setInitial(f);
  }, []);

  const loadRevisions = useCallback(async (postId: string) => {
    const r = await api<RevisionDTO[]>(`/posts/${postId}/revisions`).catch(() => null);
    if (r) setRevisions(r.data);
  }, []);

  useEffect(() => {
    api<Term[]>("/categories").then((r) => setCategories(r.data)).catch(() => null);
    api<Term[]>("/tags").then((r) => setTagList(r.data)).catch(() => null);
    api<Term[]>("/authors").then((r) => setAuthors(r.data)).catch(() => null);
  }, []);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    api<PostDTO>(`/posts/${id}`)
      .then((r) => {
        if (!alive) return;
        apply(r.data);
        setLoading(false);
        loadRevisions(r.data.id);
      })
      .catch((e) => {
        if (!alive) return;
        setNotice({ kind: "error", text: e instanceof ApiError ? e.message : "Could not load post" });
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, apply, loadRevisions]);

  // Live preview: render through the server so the preview matches what readers get.
  useEffect(() => {
    const seq = ++previewSeq.current;
    const t = setTimeout(async () => {
      try {
        const r = await api<{ html: string; readingMinutes: number }>("/preview", { method: "POST", body: { markdown: form.content } });
        if (seq === previewSeq.current) {
          setPreviewHtml(r.data.html);
          setPreviewMinutes(r.data.readingMinutes);
        }
      } catch {
        /* preview is best-effort */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [form.content]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  function buildPayload(onlyChanged: boolean) {
    const out: Record<string, unknown> = {};
    const consider = (k: keyof Form, value: unknown) => {
      if (!onlyChanged || form[k] !== initial[k]) out[k] = value;
    };
    consider("title", form.title);
    if (form.slug.trim()) consider("slug", form.slug.trim());
    consider("excerpt", form.excerpt);
    consider("content", form.content);
    consider("coverImageUrl", form.coverImageUrl.trim() || null);
    consider("status", form.status);
    consider("seoTitle", form.seoTitle.trim() || null);
    consider("seoDescription", form.seoDescription.trim() || null);
    consider("category", form.category.trim() || null);
    if (!onlyChanged || form.tags !== initial.tags) out.tags = parseTags(form.tags);
    if (form.authorId) consider("authorId", form.authorId);
    if (form.status === "scheduled" || form.status === "published" || form.publishedAt) {
      if (!onlyChanged || form.publishedAt !== initial.publishedAt || form.status !== initial.status) {
        out.publishedAt = form.publishedAt ? new Date(form.publishedAt).toISOString() : null;
      }
    }
    return out;
  }

  async function save() {
    setSaving(true);
    setNotice(null);
    setFieldErrors({});
    try {
      if (!post) {
        const r = await api<PostDTO>("/posts", { method: "POST", body: buildPayload(false) });
        setInitial(form);
        router.replace(`/admin/posts/${r.data.id}`);
        return;
      }
      const payload = buildPayload(true);
      if (Object.keys(payload).length === 0) {
        setNotice({ kind: "ok", text: "No changes to save." });
        return;
      }
      const r = await api<PostDTO>(`/posts/${post.id}`, { method: "PATCH", body: { ...payload, version: post.version } });
      apply(r.data);
      loadRevisions(r.data.id);
      setNotice({ kind: "ok", text: `Saved as version ${r.data.version}.` });
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "version_conflict") {
          setNotice({ kind: "conflict", text: "Someone else changed this post while you were editing." });
        } else {
          if (e.status === 422 && Array.isArray(e.details)) {
            setFieldErrors(Object.fromEntries((e.details as { path: string; message: string }[]).map((d) => [d.path, d.message])));
          }
          setNotice({ kind: "error", text: e.message });
        }
      } else setNotice({ kind: "error", text: "Network error. Try again." });
    } finally {
      setSaving(false);
    }
  }

  async function reloadLatest() {
    if (!post) return;
    const r = await api<PostDTO>(`/posts/${post.id}`);
    apply(r.data);
    loadRevisions(post.id);
    setNotice({ kind: "ok", text: "Loaded the latest version. Your unsaved edits were discarded." });
  }

  async function restoreRevision(rev: RevisionDTO) {
    if (!post) return;
    if (!confirm(`Roll back to version ${rev.version}? This is recorded as a new revision, so nothing is lost.`)) return;
    try {
      const r = await api<PostDTO>(`/posts/${post.id}/revisions/${rev.version}/restore`, {
        method: "POST",
        headers: { "If-Match": `"${post.version}"` },
      });
      apply(r.data);
      loadRevisions(post.id);
      setNotice({ kind: "ok", text: `Restored version ${rev.version} as version ${r.data.version}.` });
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof ApiError ? e.message : "Restore failed" });
    }
  }

  async function trashOrRestore() {
    if (!post) return;
    try {
      if (post.deletedAt) {
        apply((await api<PostDTO>(`/posts/${post.id}/restore`, { method: "POST" })).data);
        setNotice({ kind: "ok", text: "Post restored from the trash." });
      } else {
        if (!confirm("Move this post to the trash? You can restore it later.")) return;
        apply((await api<PostDTO>(`/posts/${post.id}`, { method: "DELETE" })).data);
        setNotice({ kind: "ok", text: "Moved to the trash." });
      }
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof ApiError ? e.message : "Action failed" });
    }
  }

  const label = "block text-sm font-semibold";
  const field = "mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm";
  const err = (k: string) => (fieldErrors[k] ? <p className="mt-1 text-xs font-semibold text-accent-deep">{fieldErrors[k]}</p> : null);

  if (loading) return <p className="py-20 text-center text-muted">Loading post...</p>;
  if (id && !post) {
    return (
      <div className="py-20 text-center">
        <p className="font-semibold">{notice?.text ?? "Post not found"}</p>
        <Link href="/admin" className="mt-3 inline-block font-semibold text-accent-deep underline">Back to posts</Link>
      </div>
    );
  }

  const trashed = !!post?.deletedAt;
  const live = post && !trashed && post.status === "published";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm font-semibold text-muted hover:text-ink">&larr; Posts</Link>
          {post && <StatusBadge status={post.status} trashed={trashed} />}
          {post && <span className="text-xs text-muted">v{post.version}</span>}
          {dirty && <span className="text-xs font-semibold text-accent-deep">Unsaved changes</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {live && (
            <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-paper px-3 py-2 text-sm font-semibold hover:bg-sand">
              View live
            </a>
          )}
          {post && (
            <button type="button" onClick={trashOrRestore} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm font-semibold hover:bg-sand">
              {trashed ? "Restore from trash" : "Move to trash"}
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving || trashed}
            className="rounded-full border-2 border-ink bg-accent px-6 py-2 text-sm font-bold shadow-[3px_3px_0_0_var(--color-ink)] disabled:opacity-50"
          >
            {saving ? "Saving..." : post ? "Save changes" : "Create post"}
          </button>
        </div>
      </div>

      {notice && (
        <div
          role={notice.kind === "ok" ? "status" : "alert"}
          className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold ${notice.kind === "ok" ? "bg-sage text-sage-deep" : "bg-rose text-accent-deep"}`}
        >
          <span>{notice.text}</span>
          {notice.kind === "conflict" && (
            <button type="button" onClick={reloadLatest} className="rounded-md border border-current px-3 py-1">
              Discard my edits and load latest
            </button>
          )}
        </div>
      )}
      {trashed && <p className="mt-4 rounded-lg bg-sand px-4 py-2.5 text-sm">This post is in the trash. Restore it to edit.</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <div>
            <label htmlFor="title" className={label}>Title</label>
            <input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} disabled={trashed} className={`${field} text-lg font-bold`} placeholder="A clear, specific headline" />
            {err("title")}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className={label}>Content (Markdown)</span>
              <div className="flex gap-1 lg:hidden" role="tablist">
                {(["write", "preview"] as const).map((t) => (
                  <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1 text-xs font-bold capitalize ${tab === t ? "bg-ink text-cream" : "bg-sand"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-1 grid gap-4 lg:grid-cols-2">
              <textarea
                aria-label="Markdown content"
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                disabled={trashed}
                spellCheck
                className={`min-h-[420px] w-full rounded-lg border border-line bg-paper p-3 font-mono text-sm leading-relaxed ${tab === "preview" ? "hidden lg:block" : ""}`}
                placeholder={"## Start writing\n\nMarkdown is supported: **bold**, lists, links, code blocks, images."}
              />
              <div className={`min-h-[420px] overflow-auto rounded-lg border border-line bg-paper p-4 ${tab === "write" ? "hidden lg:block" : ""}`}>
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Live preview &middot; {previewMinutes} min read</p>
                {previewHtml ? (
                  <div className="admin-preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <p className="text-sm text-muted">Nothing to preview yet.</p>
                )}
              </div>
            </div>
            {err("content")}
          </div>

          <div>
            <label htmlFor="excerpt" className={label}>Excerpt <span className="font-normal text-muted">(optional, derived from the content when empty)</span></label>
            <textarea id="excerpt" rows={2} maxLength={500} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} disabled={trashed} className={field} />
            {err("excerpt")}
          </div>

          <fieldset className="rounded-2xl border border-line bg-paper p-4">
            <legend className="px-2 text-sm font-bold">SEO</legend>
            <label htmlFor="seoTitle" className={label}>SEO title</label>
            <input id="seoTitle" value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={120} placeholder={form.title} className={field} />
            <p className="text-right text-xs text-muted">{form.seoTitle.length}/120</p>
            <label htmlFor="seoDesc" className={`${label} mt-2`}>Meta description</label>
            <textarea id="seoDesc" rows={2} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} maxLength={300} className={field} />
            <p className="text-right text-xs text-muted">{form.seoDescription.length}/300 (aim for under 160)</p>
          </fieldset>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-line bg-paper p-4">
            <h2 className="text-sm font-bold">Publishing</h2>
            <label htmlFor="status" className={`${label} mt-3`}>Status</label>
            <select id="status" value={form.status} onChange={(e) => set("status", e.target.value as Form["status"])} disabled={trashed} className={field}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
            {(form.status === "scheduled" || form.status === "published") && (
              <>
                <label htmlFor="publishedAt" className={`${label} mt-3`}>
                  {form.status === "scheduled" ? "Go live at" : "Publish date"}
                </label>
                <input id="publishedAt" type="datetime-local" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} disabled={trashed} className={field} />
                {form.status === "scheduled" && <p className="mt-1 text-xs text-muted">It appears on the site automatically once this time passes. No cron job needed.</p>}
                {err("publishedAt")}
              </>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-paper p-4">
            <h2 className="text-sm font-bold">Organise</h2>
            <label htmlFor="category" className={`${label} mt-3`}>Category</label>
            <input id="category" list="category-list" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Pick or type a new one" className={field} />
            <datalist id="category-list">{categories.map((c) => <option key={c.id} value={c.name} />)}</datalist>

            <label htmlFor="tags" className={`${label} mt-3`}>Tags <span className="font-normal text-muted">(comma separated)</span></label>
            <input id="tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="startup basics, pitching" className={field} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagList.filter((t) => !parseTags(form.tags).some((x) => x.toLowerCase() === t.name.toLowerCase())).slice(0, 12).map((t) => (
                <button key={t.id} type="button" onClick={() => set("tags", [...parseTags(form.tags), t.name].join(", "))} className="rounded-md bg-sand px-2 py-0.5 text-xs hover:bg-line">
                  + {t.name}
                </button>
              ))}
            </div>

            <label htmlFor="author" className={`${label} mt-3`}>Author</label>
            <select id="author" value={form.authorId} onChange={(e) => set("authorId", e.target.value)} className={field}>
              <option value="">Default author</option>
              {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>

            <label htmlFor="slug" className={`${label} mt-3`}>Slug</label>
            <input id="slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated from the title" className={`${field} font-mono`} />
            {err("slug")}

            <label htmlFor="cover" className={`${label} mt-3`}>Cover image URL</label>
            <input id="cover" value={form.coverImageUrl} onChange={(e) => set("coverImageUrl", e.target.value)} placeholder="https://..." className={field} />
            {err("coverImageUrl")}
          </section>

          {post && (
            <section className="rounded-2xl border border-line bg-paper p-4">
              <h2 className="text-sm font-bold">Revision history</h2>
              <p className="mt-1 text-xs text-muted">Every save is recorded. Rolling back never deletes history.</p>
              <ul className="mt-3 max-h-72 space-y-2 overflow-auto">
                {revisions.map((r, i) => (
                  <li key={r.id} className="flex items-start justify-between gap-2 rounded-lg bg-cream px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold">v{r.version}{i === 0 && <span className="ml-1 font-normal text-muted">(current)</span>}</p>
                      <p className="truncate text-muted" title={r.summary}>{r.summary}</p>
                      <p className="text-muted">{fmtDateTime(r.createdAt)}</p>
                    </div>
                    {i > 0 && !trashed && (
                      <button type="button" onClick={() => restoreRevision(r)} className="shrink-0 rounded-md border border-ink px-2 py-1 font-bold hover:bg-sand">
                        Restore
                      </button>
                    )}
                  </li>
                ))}
                {revisions.length === 0 && <li className="text-xs text-muted">No revisions yet.</li>}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
