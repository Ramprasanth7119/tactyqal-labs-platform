# Tactyqal Labs: homepage redesign and blog platform

My submission for the Tactyqal Labs **Full Stack Developer Intern** hire-a-thon (Devuty).

- **Task 1:** a redesigned homepage. It's responsive, accessible and written for the parents who make the decision.
- **Task 2:** a blog backend that replaces the separate WordPress install. It has a database schema, a versioned CRUD REST API, an admin CMS, a public blog, and a WordPress importer.

Both live in **one Next.js codebase**. Today the main site is CodeIgniter and the blog is a separate WordPress install; on 19 Nov 2026 `tactyqal.com/blog/` and its REST API returned HTTP 500. Putting both in one app means one deploy, one design system and one data layer. The homepage reads its "latest posts" straight from the blog database.

> **Live demo:** https://tactyqal-labs-platform.vercel.app · [Blog](https://tactyqal-labs-platform.vercel.app/blog) · [API docs](https://tactyqal-labs-platform.vercel.app/api-docs)
>
> **Try the admin:** [/admin](https://tactyqal-labs-platform.vercel.app/admin), password `demo-password` (demo account; please don't delete the sample posts)
>
> **Video walkthrough:** https://drive.google.com/file/d/1Fwf8Mkn0sb-1p8gZwb8GfZh4mx7mqgZl/view?usp=sharing

## What's inside

### Task 1: homepage
| What | Why it helps |
|---|---|
| One primary call to action ("Book free consultation") | The current page shows the price, six claims and two buttons before you scroll. |
| Interactive 8-week program timeline (ARIA tabs, arrow keys) | Parents can see what happens each fortnight and what their teen leaves with. |
| Success stories with category filters | Stories are found faster. It uses no fake screenshots or stock photos, only facts from the current site. |
| Price in one place, with what's included and the guarantee | The current page repeats the price in the hero and again in pricing. |
| **"Is this right for my teen?" fit check** | Three questions, honest answer, runs in the browser and stores nothing. |
| Latest posts from the new blog API | The homepage and blog share one system. |
| FAQ with `FAQPage` JSON-LD, `EducationalOrganization` JSON-LD, Open Graph | Better search results and link previews. |
| WhatsApp, email and phone contact links | Direct contact on mobile. |
| Accessibility | Skip link, visible focus, AA contrast, reduced-motion support, focus-trapped mobile menu. |
| Consistent numbers | The current page says both "100+" and "50+" students; this one uses one figure. |

Built with Next.js 15 (App Router), React 19, Tailwind CSS v4, Bricolage Grotesque and Inter, and lucide icons. All copy lives in typed data in `src/content/site.ts`.

### Task 2: blog backend
- **Database (Drizzle ORM + libSQL):**
  - Tables: `authors`, `categories`, `tags`, `posts`, `post_tags`, `post_revisions`.
  - Uses a SQLite file locally and Turso/libSQL in production, so there is no database server to run.
  - ER diagram: [`docs/blog-backend.md`](docs/blog-backend.md).
- **REST API `/api/v1`:**
  - Full CRUD on posts, plus categories, tags and authors.
  - Pagination, search, filters and sorting.
  - Responses use a consistent `{data, meta}` / `{error}` envelope with proper status codes (401 / 404 / 409 / 422 / 429).
- **Post workflow:**
  - Draft, published, scheduled and archived states.
  - Scheduled posts go live on their own, with no cron job, because visibility is checked when the post is read.
  - Soft delete with restore (trash).
  - **Revision history:** every save is a revision, and any revision can be restored.
  - **Optimistic locking** (`If-Match` or `version`): two editors can't silently overwrite each other; the second save gets HTTP 409.
- **Security:**
  - Writes need a Bearer API key or a signed httpOnly session cookie (HMAC, constant-time compare).
  - The admin is protected by middleware, and the login is rate limited.
  - Markdown is rendered to sanitized HTML on the server.
- **Docs:** OpenAPI 3.1 at `/api/v1/openapi.json`, and a readable reference with curl examples at `/api-docs`.
- **Admin CMS at `/admin`:**
  - Post table with status tabs, search and trash.
  - Markdown editor with live preview.
  - Schedule picker, tags, category, SEO fields, and revision restore.
- **Public blog:**
  - `/blog` with search, category and tag filters, and pagination.
  - Article pages with OG tags, `BlogPosting` JSON-LD, related posts and reading time.
  - `/blog/rss.xml`, `/sitemap.xml` and `/robots.txt`.
- **WordPress migration:**
  - `npm run import:wordpress -- --file export.xml` takes a WordPress export (WXR).
  - `--url https://site/wp-json` uses the WordPress REST API instead.
  - Either way it maps posts, categories, tags and authors, converts HTML to Markdown, and is idempotent by slug. `--dry-run` is supported.
- **Tests:** 27 Vitest tests run against a real temporary SQLite database. They cover CRUD, validation, auth, slugs, conflicts, soft delete, revisions, scheduling, search, sanitization, sessions, rate limiting and the importer.

## Run it locally

```bash
npm install
npm run setup        # create the SQLite database and seed sample posts
npm run dev          # http://localhost:3000
```

- **Admin:** open http://localhost:3000/admin. With no `.env` file, the dev password is `admin123` and the API key is `dev-admin-key`. Copy `.env.example` to `.env` to set your own values. Production has no defaults.
- **API example:**
  ```bash
  curl http://localhost:3000/api/v1/posts?q=startup
  curl -X POST http://localhost:3000/api/v1/posts \
    -H "Authorization: Bearer dev-admin-key" -H "Content-Type: application/json" \
    -d '{"title":"Hello","content":"## First post","status":"published"}'
  ```
- **Checks:**
  ```bash
  npm test && npm run typecheck && npm run lint && npm run build
  ```

## Deploying
1. Create a Turso database.
2. Set `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `ADMIN_API_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET` and `NEXT_PUBLIC_SITE_URL`.
3. Run `npm run setup` once against it, then deploy to Vercel or any Node host.

Without `DATABASE_URL`, a Vercel deploy runs in **demo mode**: a temporary SQLite database in `/tmp` is created and seeded on each cold start. Edits are not permanent there, so use Turso for real use.

## Project layout
```
src/app/(site)/          homepage + public blog (shared header/footer)
src/app/admin/           CMS
src/app/api/v1/          REST API (thin handlers)
src/lib/blog/            service layer: posts, taxonomy, markdown, importer, seed
src/lib/db/              Drizzle schema + client
src/components/          site + homepage components
drizzle/                 SQL migrations
scripts/                 migrate, seed, reset, WordPress import
tests/                   Vitest suites
docs/                    backend design, ER diagram, source-site content notes
```

## Notes
- **Homepage copy** comes from the current tactyqal.com page (see `docs/source-site-content.md`). The six blog post titles and dates are real. Their bodies are short sample articles I wrote, because the live blog was returning errors.
- **Not tested:** a live Turso connection and `--url` import against a live WordPress site. Both are covered by unit tests with a local file and a mocked API only.
- **AI use:** I used AI assistance (Claude Code), which the brief allows. I reviewed, ran and tested the code myself.
