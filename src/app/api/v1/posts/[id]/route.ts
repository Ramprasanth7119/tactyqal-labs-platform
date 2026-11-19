import { cacheHeaders, handle, ifMatchVersion, json, queryObject, readBody } from "@/lib/api/http";
import { isAdminRequest, requireAdmin } from "@/lib/auth/guard";
import { getPost, hardDeletePost, softDeletePost, updatePost } from "@/lib/blog/posts";
import { updatePostSchema } from "@/lib/blog/validation";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** `id` may be the post UUID or its slug. */
export const GET = handle<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const admin = await isAdminRequest(req);
  const post = await getPost(id, { admin });
  return json(post, { headers: { ...(await cacheHeaders(req)), ETag: `"${post.version}"` } });
});

export const PATCH = handle<Ctx>(async (req, { params }) => {
  await requireAdmin(req);
  const { id } = await params;
  const input = await readBody(req, updatePostSchema);
  const current = await getPost(id, { admin: true });
  const post = await updatePost(current.id, input, { expectedVersion: ifMatchVersion(req) });
  return json(post, { headers: { ETag: `"${post.version}"` } });
});

/** Soft delete by default (moves to trash). `?hard=true` removes the row and its history permanently. */
export const DELETE = handle<Ctx>(async (req, { params }) => {
  await requireAdmin(req);
  const { id } = await params;
  const current = await getPost(id, { admin: true });
  if (queryObject(req).hard === "true") {
    await hardDeletePost(current.id);
    return json({ id: current.id, deleted: true, hard: true });
  }
  return json(await softDeletePost(current.id));
});
