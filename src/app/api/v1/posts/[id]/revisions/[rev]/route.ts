import { handle, json } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guard";
import { badRequest } from "@/lib/blog/errors";
import { getPost, getRevision } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

export const GET = handle<{ params: Promise<{ id: string; rev: string }> }>(async (req, { params }) => {
  await requireAdmin(req);
  const { id, rev } = await params;
  const n = Number(rev.replace(/^v/i, ""));
  if (!Number.isInteger(n) || n < 1) throw badRequest("Revision must be a positive integer version, e.g. 3");
  const post = await getPost(id, { admin: true });
  return json(await getRevision(post.id, n), { headers: { "Cache-Control": "private, no-store" } });
});
