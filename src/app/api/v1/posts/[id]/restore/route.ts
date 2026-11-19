import { handle, json } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guard";
import { getPost, restorePost } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

/** Undelete a soft-deleted post. */
export const POST = handle<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  await requireAdmin(req);
  const { id } = await params;
  const current = await getPost(id, { admin: true });
  return json(await restorePost(current.id));
});
