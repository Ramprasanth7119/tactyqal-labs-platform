import { handle, json } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guard";
import { getPost, listRevisions } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

export const GET = handle<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  await requireAdmin(req);
  const { id } = await params;
  const post = await getPost(id, { admin: true });
  const revisions = await listRevisions(post.id);
  return json(revisions, {
    meta: { total: revisions.length, currentVersion: post.version },
    headers: { "Cache-Control": "private, no-store" },
  });
});
