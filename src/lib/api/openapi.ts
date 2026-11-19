// Hand-written OpenAPI 3.1 document, served at /api/v1/openapi.json and rendered at /api-docs.
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const resp = (description: string, schema: object) => ({
  description,
  content: { "application/json": { schema } },
});
const envelope = (data: object, meta?: object) => ({
  type: "object",
  required: ["data", "meta"],
  properties: { data, meta: meta ?? { type: "object" } },
});
const err = (description: string) => resp(description, ref("Error"));
const writeErrors = {
  "400": err("Malformed JSON or parameters"),
  "401": err("Missing or invalid credentials"),
  "422": err("Validation failed (details lists each field)"),
};
const secured = [{ bearerAuth: [] }, { cookieAuth: [] }];
const idParam = {
  name: "id",
  in: "path",
  required: true,
  description: "Post UUID (or slug for GET)",
  schema: { type: "string" },
};
const ifMatch = {
  name: "If-Match",
  in: "header",
  required: false,
  description: 'Optimistic concurrency: the post version you last saw, e.g. "3". Mismatch returns 409.',
  schema: { type: "string" },
};

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Tactyqal Labs Blog API",
    version: "1.0.0",
    description:
      "Typed REST API for the Tactyqal Labs blog. Replaces the standalone WordPress install: one codebase, one deploy.\n\n" +
      "**Reads** are public (published posts only). **Writes** need `Authorization: Bearer <ADMIN_API_KEY>` or the admin session cookie.\n\n" +
      "Every response uses the envelope `{ data, meta }` or `{ error: { code, message, details } }`.\n\n" +
      "Scheduled posts become visible automatically once `publishedAt <= now`; there is no cron job.",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    { name: "Posts" },
    { name: "Revisions" },
    { name: "Taxonomy" },
    { name: "Auth" },
    { name: "System" },
  ],
  paths: {
    "/posts": {
      get: {
        tags: ["Posts"],
        summary: "List posts",
        description: "Public callers only see live posts. Admins may pass `status` and `deleted` filters.",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } },
          { name: "q", in: "query", description: "Search title, excerpt and content (all words must match)", schema: { type: "string" } },
          { name: "tag", in: "query", description: "Tag slug", schema: { type: "string" } },
          { name: "category", in: "query", description: "Category slug", schema: { type: "string" } },
          { name: "author", in: "query", description: "Author slug", schema: { type: "string" } },
          {
            name: "status",
            in: "query",
            description: "Admin only for anything except `published`. `all` returns every status.",
            schema: { enum: ["draft", "published", "scheduled", "archived", "all"] },
          },
          { name: "deleted", in: "query", description: "Admin only. `true` includes trash, `only` lists just trash.", schema: { enum: ["true", "only", "false"] } },
          { name: "sort", in: "query", description: "Field, `-` prefix for descending", schema: { type: "string", default: "-publishedAt", examples: ["-publishedAt", "title", "-readingMinutes"] } },
          { name: "include", in: "query", description: "`content` adds markdown + HTML bodies to each list item", schema: { enum: ["content"] } },
        ],
        responses: {
          "200": resp("A page of posts", envelope({ type: "array", items: ref("Post") }, ref("PageMeta"))),
          "401": err("Non-admin used an admin-only filter"),
          "422": err("Invalid query parameter"),
        },
      },
      post: {
        tags: ["Posts"],
        summary: "Create a post",
        security: secured,
        requestBody: { required: true, content: { "application/json": { schema: ref("PostInput") } } },
        responses: {
          "201": resp("Created", envelope(ref("Post"))),
          ...writeErrors,
          "409": err("Slug already in use (code `slug_taken`)"),
        },
      },
    },
    "/posts/{id}": {
      parameters: [idParam],
      get: {
        tags: ["Posts"],
        summary: "Get a post by id or slug",
        description: "Response carries an `ETag` equal to the post version.",
        responses: { "200": resp("The post", envelope(ref("Post"))), "404": err("Not found, or not visible to the caller") },
      },
      patch: {
        tags: ["Posts"],
        summary: "Update a post",
        description: "Partial update. Send `version` in the body or `If-Match` to enable optimistic concurrency. Every update records a revision.",
        security: secured,
        parameters: [ifMatch],
        requestBody: { required: true, content: { "application/json": { schema: ref("PostPatch") } } },
        responses: {
          "200": resp("Updated", envelope(ref("Post"))),
          ...writeErrors,
          "404": err("Not found"),
          "409": err("`version_conflict` (stale version), `slug_taken`, or post is in the trash"),
        },
      },
      delete: {
        tags: ["Posts"],
        summary: "Delete a post (soft by default)",
        security: secured,
        parameters: [{ name: "hard", in: "query", description: "`true` permanently deletes the post and its revisions", schema: { type: "boolean" } }],
        responses: { "200": resp("Soft-deleted post, or `{id, deleted, hard}` for a hard delete", envelope({})), "401": err("Unauthorized"), "404": err("Not found") },
      },
    },
    "/posts/{id}/restore": {
      parameters: [idParam],
      post: {
        tags: ["Posts"],
        summary: "Undelete a soft-deleted post",
        security: secured,
        responses: { "200": resp("Restored", envelope(ref("Post"))), "401": err("Unauthorized"), "404": err("Not found") },
      },
    },
    "/posts/{id}/revisions": {
      parameters: [idParam],
      get: {
        tags: ["Revisions"],
        summary: "List revisions (newest first)",
        security: secured,
        responses: { "200": resp("Revisions", envelope({ type: "array", items: ref("Revision") })), "401": err("Unauthorized"), "404": err("Not found") },
      },
    },
    "/posts/{id}/revisions/{rev}": {
      parameters: [idParam, { name: "rev", in: "path", required: true, description: "Revision version number", schema: { type: "integer" } }],
      get: {
        tags: ["Revisions"],
        summary: "Get one revision including its full snapshot",
        security: secured,
        responses: { "200": resp("Revision", envelope(ref("Revision"))), "401": err("Unauthorized"), "404": err("Not found") },
      },
    },
    "/posts/{id}/revisions/{rev}/restore": {
      parameters: [idParam, { name: "rev", in: "path", required: true, schema: { type: "integer" } }],
      post: {
        tags: ["Revisions"],
        summary: "Roll the post back to a revision",
        description: "History is never rewritten: the rollback is recorded as a new revision.",
        security: secured,
        parameters: [ifMatch],
        responses: { "200": resp("Restored post", envelope(ref("Post"))), "401": err("Unauthorized"), "404": err("Not found"), "409": err("Version conflict") },
      },
    },
    "/categories": {
      get: { tags: ["Taxonomy"], summary: "List categories with live post counts", responses: { "200": resp("Categories", envelope({ type: "array", items: ref("Term") })) } },
      post: {
        tags: ["Taxonomy"],
        summary: "Create a category",
        security: secured,
        requestBody: { required: true, content: { "application/json": { schema: ref("TermInput") } } },
        responses: { "201": resp("Created", envelope(ref("Term"))), ...writeErrors, "409": err("Slug in use") },
      },
    },
    "/tags": {
      get: { tags: ["Taxonomy"], summary: "List tags with live post counts", responses: { "200": resp("Tags", envelope({ type: "array", items: ref("Term") })) } },
      post: {
        tags: ["Taxonomy"],
        summary: "Create a tag",
        security: secured,
        requestBody: { required: true, content: { "application/json": { schema: ref("TermInput") } } },
        responses: { "201": resp("Created", envelope(ref("Term"))), ...writeErrors, "409": err("Slug in use") },
      },
    },
    "/authors": {
      get: { tags: ["Taxonomy"], summary: "List authors", responses: { "200": resp("Authors", envelope({ type: "array", items: ref("Author") })) } },
      post: {
        tags: ["Taxonomy"],
        summary: "Create an author",
        security: secured,
        requestBody: { required: true, content: { "application/json": { schema: ref("AuthorInput") } } },
        responses: { "201": resp("Created", envelope(ref("Author"))), ...writeErrors, "409": err("Slug in use") },
      },
    },
    "/preview": {
      post: {
        tags: ["System"],
        summary: "Render markdown with the production sanitizer (admin)",
        security: secured,
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["markdown"], properties: { markdown: { type: "string" } } } } } },
        responses: { "200": resp("Sanitized HTML", envelope({ type: "object", properties: { html: { type: "string" }, readingMinutes: { type: "integer" } } })), "401": err("Unauthorized") },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Sign in with the admin password (sets an httpOnly session cookie)",
        description: "Rate limited per IP; returns 429 with `Retry-After` when exceeded.",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["password"], properties: { password: { type: "string" } } } } } },
        responses: { "200": resp("Signed in", envelope({ type: "object", properties: { authenticated: { type: "boolean" } } })), "401": err("Wrong password"), "429": err("Too many attempts") },
      },
    },
    "/auth/logout": { post: { tags: ["Auth"], summary: "Clear the session cookie", responses: { "200": resp("Signed out", envelope({})) } } },
    "/auth/me": { get: { tags: ["Auth"], summary: "Whether the caller is authenticated as admin", responses: { "200": resp("Status", envelope({ type: "object", properties: { authenticated: { type: "boolean" } } })) } } },
    "/health": { get: { tags: ["System"], summary: "Liveness and database check", responses: { "200": resp("OK", envelope({ type: "object" })) } } },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", description: "The ADMIN_API_KEY environment value" },
      cookieAuth: { type: "apiKey", in: "cookie", name: "tq_session", description: "Set by POST /auth/login" },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { enum: ["bad_request", "unauthorized", "not_found", "conflict", "version_conflict", "slug_taken", "validation_failed", "rate_limited", "unavailable", "internal"] },
              message: { type: "string" },
              details: {},
            },
          },
        },
      },
      PageMeta: {
        type: "object",
        properties: { page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" }, totalPages: { type: "integer" }, hasNext: { type: "boolean" } },
      },
      Term: {
        type: "object",
        properties: { id: { type: "string" }, name: { type: "string" }, slug: { type: "string" }, description: { type: ["string", "null"] }, postCount: { type: "integer" } },
      },
      TermInput: { type: "object", required: ["name"], properties: { name: { type: "string" }, slug: { type: "string" }, description: { type: "string" } } },
      Author: {
        type: "object",
        properties: { id: { type: "string" }, name: { type: "string" }, slug: { type: "string" }, bio: { type: ["string", "null"] }, avatarUrl: { type: ["string", "null"] } },
      },
      AuthorInput: { type: "object", required: ["name"], properties: { name: { type: "string" }, slug: { type: "string" }, email: { type: "string", format: "email" }, bio: { type: "string" }, avatarUrl: { type: "string" } } },
      Post: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          slug: { type: "string" },
          title: { type: "string" },
          excerpt: { type: "string" },
          content: { type: "string", description: "Markdown source" },
          contentHtml: { type: "string", description: "Sanitized HTML" },
          coverImageUrl: { type: ["string", "null"] },
          status: { enum: ["draft", "published", "scheduled", "archived"], description: "Effective status (a due scheduled post reads as published)" },
          publishedAt: { type: ["string", "null"], format: "date-time" },
          readingMinutes: { type: "integer" },
          seoTitle: { type: ["string", "null"] },
          seoDescription: { type: ["string", "null"] },
          author: { type: ["object", "null"], properties: { id: { type: "string" }, name: { type: "string" }, slug: { type: "string" } } },
          category: { type: ["object", "null"], properties: { id: { type: "string" }, name: { type: "string" }, slug: { type: "string" } } },
          tags: { type: "array", items: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, slug: { type: "string" } } } },
          legacyUrl: { type: ["string", "null"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          deletedAt: { type: ["string", "null"], format: "date-time" },
          version: { type: "integer" },
        },
      },
      PostInput: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", minLength: 3, maxLength: 200 },
          slug: { type: "string", description: "Optional; generated from the title and made unique when omitted" },
          excerpt: { type: "string", description: "Optional; derived from the content when omitted" },
          content: { type: "string", description: "Markdown" },
          coverImageUrl: { type: ["string", "null"] },
          status: { enum: ["draft", "published", "scheduled", "archived"], default: "draft" },
          publishedAt: { type: ["string", "null"], format: "date-time", description: "Required for `scheduled`; defaults to now for `published`" },
          seoTitle: { type: ["string", "null"] },
          seoDescription: { type: ["string", "null"] },
          authorId: { type: ["string", "null"] },
          category: { type: ["string", "null"], description: "Category id, slug or name (created if new)" },
          tags: { type: "array", items: { type: "string" }, description: "Tag ids, slugs or names (created if new)" },
        },
        example: {
          title: "Why prototypes beat pitch decks",
          content: "## Show, don't tell\n\nA clickable prototype answers questions a deck cannot.",
          status: "scheduled",
          publishedAt: "2030-01-15T09:00:00Z",
          category: "Entrepreneurship",
          tags: ["prototyping", "validation"],
        },
      },
      PostPatch: {
        allOf: [ref("PostInput")],
        description: "Every field is optional. `title` is not required on PATCH.",
        properties: { version: { type: "integer", description: "Expected current version; 409 `version_conflict` if stale" } },
      },
      Revision: {
        type: "object",
        properties: {
          id: { type: "string" },
          postId: { type: "string" },
          version: { type: "integer" },
          summary: { type: "string", examples: ["Changed title, content"] },
          createdAt: { type: "string", format: "date-time" },
          snapshot: { type: "object", description: "Full editable state at that version (single-revision GET only)" },
        },
      },
    },
  },
} as const;
