import { handle, ifMatchVersion, json } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guard";
import { badRequest } from "@/lib/blog/errors";
import { getPost, restoreRevision } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

/** Roll back to revision `rev`. History is kept: the rollback itself becomes a new revision. */
export const POST = handle<{ params: Promise<{ id: string; rev: string }> }>(async (req, { params }) => {
  await requireAdmin(req);
  const { id, rev } = await params;
  const n = Number(rev.replace(/^v/i, ""));
  if (!Number.isInteger(n) || n < 1) throw badRequest("Revision must be a positive integer version, e.g. 3");
  const post = await getPost(id, { admin: true });
  const restored = await restoreRevision(post.id, n, { expectedVersion: ifMatchVersion(req) });
  return json(restored, { headers: { ETag: `"${restored.version}"` } });
});
