"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PostDTO } from "@/lib/blog/types";
import { api, ApiError, fmtDateTime } from "./api";
import { StatusBadge } from "./status-badge";

type Term = { id: string; name: string; slug: string };
const STATUS_TABS = [
  ["all", "All"],
  ["published", "Published"],
  ["scheduled", "Scheduled"],
  ["draft", "Drafts"],
  ["archived", "Archived"],
  ["trash", "Trash"],
] as const;

export function PostsTable() {
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Term[]>([]);
  const [rows, setRows] = useState<PostDTO[] | null>(null);
  const [meta, setMeta] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 1 });
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    api<Term[]>("/categories").then((r) => setCategories(r.data)).catch(() => null);
  }, []);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page), limit: "10", sort: "-updatedAt" });
    if (status === "trash") {
      p.set("status", "all");
      p.set("deleted", "only");
    } else p.set("status", status);
    if (debouncedQ) p.set("q", debouncedQ);
    if (category) p.set("category", category);
    try {
      const r = await api<PostDTO[]>(`/posts?${p}`);
      setRows(r.data);
      setMeta({ total: Number(r.meta.total ?? 0), totalPages: Number(r.meta.totalPages ?? 1) });
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load posts");
    }
  }, [status, debouncedQ, category, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(post: PostDTO, action: "trash" | "restore" | "hard") {
    if (action === "hard" && !confirm(`Permanently delete "${post.title}" and its revisions? This cannot be undone.`)) return;
    if (action === "trash" && !confirm(`Move "${post.title}" to the trash?`)) return;
    setBusyId(post.id);
    try {
      if (action === "restore") await api(`/posts/${post.id}/restore`, { method: "POST" });
      else await api(`/posts/${post.id}${action === "hard" ? "?hard=true" : ""}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const input = "rounded-lg border border-line bg-paper px-3 py-2 text-sm";
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Posts</h1>
          <p className="text-sm text-muted">{meta.total} {meta.total === 1 ? "post" : "posts"}</p>
        </div>
        <Link href="/admin/posts/new" className="rounded-full border-2 border-ink bg-accent px-5 py-2.5 text-sm font-bold shadow-[3px_3px_0_0_var(--color-ink)]">
          + New post
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {STATUS_TABS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={status === key}
            onClick={() => {
              setStatus(key);
              setPage(1);
            }}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${status === key ? "border-ink bg-ink text-cream" : "border-line bg-paper hover:bg-sand"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, excerpt, content..."
          aria-label="Search posts"
          className={`${input} min-w-0 flex-1 sm:max-w-sm`}
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by category"
          className={input}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-rose px-4 py-2 text-sm font-semibold text-accent-deep">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-sand/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows === null && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">Loading...</td>
              </tr>
            )}
            {rows?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">No posts match these filters.</td>
              </tr>
            )}
            {rows?.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-cream/60">
                <td className="max-w-xs px-4 py-3">
                  <Link href={`/admin/posts/${p.id}`} className="font-semibold hover:underline">
                    {p.title}
                  </Link>
                  <div className="truncate font-mono text-xs text-muted">/{p.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} trashed={!!p.deletedAt} />
                  {p.status === "scheduled" && !p.deletedAt && (
                    <div className="mt-1 text-xs text-muted">{fmtDateTime(p.publishedAt)}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{p.category?.name ?? "-"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDateTime(p.updatedAt)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {p.deletedAt ? (
                    <>
                      <button disabled={busyId === p.id} onClick={() => act(p, "restore")} className="mr-3 font-semibold text-sage-deep hover:underline">Restore</button>
                      <button disabled={busyId === p.id} onClick={() => act(p, "hard")} className="font-semibold text-accent-deep hover:underline">Delete forever</button>
                    </>
                  ) : (
                    <>
                      <Link href={`/admin/posts/${p.id}`} className="mr-3 font-semibold hover:underline">Edit</Link>
                      {p.status === "published" && (
                        <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="mr-3 font-semibold text-muted hover:underline">View</a>
                      )}
                      <button disabled={busyId === p.id} onClick={() => act(p, "trash")} className="font-semibold text-accent-deep hover:underline">Trash</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-line bg-paper px-3 py-1.5 font-semibold disabled:opacity-40">
            Previous
          </button>
          <span className="text-muted">Page {page} of {meta.totalPages}</span>
          <button disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-line bg-paper px-3 py-1.5 font-semibold disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
