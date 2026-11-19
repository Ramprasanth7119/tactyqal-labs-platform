import { z } from "zod";
import { POST_STATUSES } from "@/lib/db/schema";
import { SLUG_RE } from "./slug";

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === "" || /^(https?:\/\/|\/)/i.test(v), "must be an http(s) URL or a site-relative path")
  .nullish();

const dateInput = z.union([z.string().datetime({ offset: true }), z.coerce.date()]).nullish();

const postFields = {
  title: z.string().trim().min(3, "must be at least 3 characters").max(200),
  slug: z.string().trim().min(1).max(100).regex(SLUG_RE, "lowercase letters, numbers and hyphens only"),
  excerpt: z.string().max(500),
  content: z.string().max(200_000),
  coverImageUrl: optionalUrl,
  status: z.enum(POST_STATUSES),
  publishedAt: dateInput,
  seoTitle: z.string().trim().max(120).nullish(),
  seoDescription: z.string().trim().max(300).nullish(),
  authorId: z.string().min(1).nullish(),
  /** Category id, slug or name. Unknown names are created on the fly. */
  category: z.string().trim().max(80).nullish(),
  /** Tag ids, slugs or names. Unknown names are created on the fly. */
  tags: z.array(z.string().trim().min(1).max(60)).max(20),
  legacyUrl: z.string().trim().max(2048).nullish(),
};

export const createPostSchema = z
  .object({
    ...postFields,
    title: postFields.title,
    slug: postFields.slug.optional(),
    excerpt: postFields.excerpt.optional(),
    content: postFields.content.default(""),
    status: postFields.status.default("draft"),
    tags: postFields.tags.optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.status === "scheduled" && !v.publishedAt) {
      ctx.addIssue({ code: "custom", path: ["publishedAt"], message: "required when status is 'scheduled'" });
    }
  });

export const updatePostSchema = z
  .object(postFields)
  .partial()
  .extend({
    /** Optimistic concurrency token; also accepted via the If-Match header. */
    version: z.number().int().positive().optional(),
  })
  .strict();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

const intParam = (def: number, min: number, max: number) => z.coerce.number().int().min(min).max(max).default(def);

export const SORT_FIELDS = ["publishedAt", "createdAt", "updatedAt", "title", "readingMinutes"] as const;

export const listPostsSchema = z.object({
  page: intParam(1, 1, 100_000),
  limit: intParam(10, 1, 50),
  q: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  author: z.string().trim().max(80).optional(),
  status: z.enum([...POST_STATUSES, "all"]).optional(),
  /** Admin only: `true` includes trashed posts, `only` lists just the trash. */
  deleted: z.enum(["true", "only", "false"]).optional(),
  sort: z
    .string()
    .regex(new RegExp(`^-?(${SORT_FIELDS.join("|")})$`), `one of ${SORT_FIELDS.join(", ")} (prefix with - for descending)`)
    .default("-publishedAt"),
  include: z.enum(["content"]).optional(),
});
export type ListPostsParams = z.infer<typeof listPostsSchema>;

export const createTermSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(100).regex(SLUG_RE).optional(),
  description: z.string().trim().max(500).nullish(),
});

export const createAuthorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(100).regex(SLUG_RE).optional(),
  email: z.string().trim().email().nullish(),
  bio: z.string().trim().max(1000).nullish(),
  avatarUrl: optionalUrl,
});

export const loginSchema = z.object({ password: z.string().min(1).max(200) });
export const previewSchema = z.object({ markdown: z.string().max(200_000) });
