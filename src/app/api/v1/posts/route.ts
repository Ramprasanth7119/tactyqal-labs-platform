import { cacheHeaders, handle, json, queryObject, readBody } from "@/lib/api/http";
import { isAdminRequest, requireAdmin } from "@/lib/auth/guard";
import { createPost, listPosts } from "@/lib/blog/posts";
import { createPostSchema } from "@/lib/blog/validation";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const admin = await isAdminRequest(req);
  const { items, meta } = await listPosts(queryObject(req), { admin });
  return json(items, { meta, headers: await cacheHeaders(req) });
});

export const POST = handle(async (req) => {
  await requireAdmin(req);
  const input = await readBody(req, createPostSchema);
  const post = await createPost(input, { admin: true });
  return json(post, { status: 201, headers: { Location: `/api/v1/posts/${post.id}`, ETag: `"${post.version}"` } });
});
