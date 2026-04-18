# DistortNewYork — Project Context

NYC underground show listings site. Pulls show data from venue scrapers (Playwright + Claude Haiku), stores in Postgres, displays via Next.js App Router. Live at distortnewyork.com.

---

## Tech Stack

- **Next.js** — App Router, latest version, no src/ folder
- **TypeScript** — loose (strict: false)
- **CSS** — CSS Modules only, no Tailwind, mobile-first, CSS Grid for layouts, flexbox for small inline things
- **Database** — Neon Postgres (serverless) via Prisma 7
- **Hosting** — Vercel (Production + Preview environments)
- **Storage** — Vercel Blob (image uploads, replacing AWS S3)
- **Analytics** — @vercel/analytics

---

## Architecture

### Data Flow
```
Playwright scrapers (per venue)
  → Claude Haiku extracts structured JSON (~$0.04/week)
  → POST /api/shows (ingestion endpoint)
  → Neon Postgres via Prisma
  → Server Components render pages
```

Scrapers are run manually from the repo root. The ingestion endpoint upserts shows (slug-based deduplication) and upserts venues.

### Pages (all Server Components unless noted)
| Route | Description |
|---|---|
| `/` | Featured shows + newsletter signup |
| `/shows` | All shows + live search (`?q=`) |
| `/shows/[slug]` | Show detail + comments |
| `/search` | Search results (`?q=`) |
| `/venues` | All venues |
| `/venues/[slug]` | Venue detail + its shows |
| `/contact` | Submit a show form |

### Mutations (Server Actions in `actions/`)
- `actions/newsletter.ts` — newsletter subscribe
- `actions/comments.ts` — add/get comments
- `actions/contact.ts` — submit show form (Vercel Blob for image upload)

### Ingestion API
- `app/api/shows/route.ts` — POST only, for scrapers. Accepts show + venue data, upserts both.

---

## Database Schema

Models: `Show`, `Venue`, `Comment`, `Newsletter`, `Contact`

Key decisions:
- `Show` has a `slug` (unique) used in URLs — not the internal `id`
- `Show` belongs to a `Venue` via `venueId` — no loose location strings
- `Comment` cascades on `Show` delete
- `Contact.status` is an enum: `PENDING | APPROVED | REJECTED`
- `Show.updatedAt` exists for scraper upserts
- Indexes on `Show.date`, `Show.isFeatured`, `Show.venueId`, `Comment.showId`

Prisma client is generated to `lib/generated/prisma/` — never edit directly.

---

## Environments

**All environments share a single Neon database.** The Neon Vercel integration was removed because the plan only supported 1 branch. `DATABASE_URL` is set manually in Vercel env vars for both Production and Preview.

| Environment | Branch | Database |
|---|---|---|
| Production | `main` | Neon — single shared DB |
| Preview | any feature branch | Neon — same shared DB |
| Development | local | Neon — same shared DB (via `.env.local`) |

> ⚠️ There is no database isolation between environments. Scraper data, migrations, and any writes from preview deployments all affect the same database.

Migration commands:
- `npx prisma migrate dev --name xyz` — local only
- `npx prisma migrate deploy` — production only (runs in Vercel build)

---

## What Has Been Done

### Completed
- [x] Apple dark mode color system in `styles/globals.css`
- [x] Full App Router migration — all pages, layouts, loading/error boundaries
- [x] All components converted from `.js` → `.tsx`, old `.js` files deleted
- [x] Components simplified — ShowHeader/Body/Footer merged into `show-content.tsx`, NewComment/CommentList merged into `comments.tsx`
- [x] `lib/prisma.ts` — Prisma 7 singleton using `PrismaNeon` driver adapter
- [x] `lib/shows.ts` — all query functions (getFeaturedShows, getAllShows, getShowBySlug, searchShows, getShowsByDate, getAllVenues, getVenueBySlug, upsertVenue)
- [x] `tsconfig.json` — loose TypeScript, `@/*` path alias
- [x] `actions/newsletter.ts`, `actions/comments.ts`, `actions/contact.ts`
- [x] `app/api/shows/route.ts` — scraper ingestion endpoint with venue upsert
- [x] Prisma schema with all models, indexes, enums
- [x] Initial migration: `20260417223129_init`
- [x] `@vercel/blob` installed, wired into `actions/contact.ts`
- [x] Old dependencies removed: `mongodb`, `swr`, `multer`, `next-connect`, `aws-sdk`, `@aws-sdk/client-s3`
- [x] npm scripts added: `migrate:dev`, `migrate:deploy`, `migrate:status`, `db:generate`, `db:studio`
- [x] Build script runs `prisma migrate deploy && next build`
- [x] `WORKFLOW.md` and `SCRAPERS.md` docs written
- [x] `next.config.js` created — `serverComponentsExternalPackages: ['undici']` for Vercel Blob compat
- [x] `npm run build` passes clean

### Still To Do
- [ ] Secure `/api/shows` with `INGEST_SECRET` bearer token check (see `SCRAPERS.md`)
- [ ] Create scraper repo `danicodes01/distort-scrapers` per `SCRAPERS.md`
- [ ] CSS module files — remaining files still have some hardcoded colors (not CSS vars)
- [ ] Set up fork/upstream git remotes (see `WORKFLOW.md`)

---

## Code Conventions

### Never do
- Hardcode colors — always use CSS variables from `globals.css`
- Use Tailwind
- Use `src/` folder
- Add comments that explain what the code does — only add comments for non-obvious WHY
- Use `any` types unless truly necessary
- Create API routes for internal data fetching — use Server Components
- Self-merge PRs

### Always do
- Mobile-first CSS
- CSS Grid for layout, flexbox for inline/small things
- Server Components for data reads
- Server Actions for mutations
- `useRouter` from `next/navigation` (not `next/router`)
- `loading.tsx` + `error.tsx` per route segment
- Commit `prisma/migrations/` whenever schema changes
- Use `slug` in URLs, not internal IDs

### File naming
- Pages: `page.tsx`
- Layouts: `layout.tsx`
- Components: `kebab-case.tsx`
- Actions: `kebab-case.ts` in `actions/`
- Branch names: `dan/feature-name`

---

## CSS Architecture

Global vars in `styles/globals.css`. All colors go through these vars — no exceptions.

```css
/* Backgrounds */
--color-bg              /* page background */
--color-bg-elevated     /* cards, nav, surfaces */
--color-bg-elevated-2   /* inputs, nested surfaces */

/* Text */
--color-text            /* primary */
--color-text-secondary  /* secondary */
--color-text-tertiary   /* muted, icons */

/* Accent + Feedback */
--color-accent          /* #BF5AF2 — Apple systemPurple */
--color-success         /* #30D158 — Apple systemGreen */
--color-error           /* #FF453A — Apple systemRed */

/* Structural */
--color-separator       /* borders, dividers */
--color-fill            /* hover states, fills */
```

Spacing uses `--size-1` through `--size-40` (defined in globals.css).

### CSS Best Practices (2025/2026)

**Layout model**
- `display: grid` for any two-dimensional or page-level layout (header, page sections, card grids)
- `display: flex` only for one-dimensional inline/small things (nav link lists, button groups, icon+label pairs)
- Never use `float` or fixed `height` on containers — let content + padding define height

**Mobile-first**
- Write base styles for the smallest screen, then layer on `@media (min-width: ...)` overrides
- Breakpoints: `768px` (tablet), `1024px` (desktop) — add more only when the design actually needs it
- No `@media (max-width: ...)` queries — always min-width

**Logical properties** (use these instead of physical directions)
- `padding-block` / `padding-inline` instead of `padding-top/bottom` / `padding-left/right`
- `margin-block` / `margin-inline` instead of `margin-top/bottom` / `margin-left/right`
- `inset-inline-start` instead of `left`

**Spacing**
- Use `gap` on grid/flex containers instead of `margin` on children
- All spacing values come from `--size-*` vars — no raw `px` or `rem` literals

**Other rules**
- No hardcoded colors — CSS vars only
- `display: block` on `<img>` / Next.js `<Image>` to eliminate inline baseline gap
- Avoid fixed pixel widths on layout containers — prefer `%`, `fr`, `min-content`, `max-content`

---

## Key Files

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Database schema — source of truth |
| `lib/prisma.ts` | Prisma client singleton |
| `lib/shows.ts` | All DB queries + exported types |
| `styles/globals.css` | Global styles + all CSS variables |
| `prisma.config.ts` | Prisma 7 config — datasource URLs |
| `WORKFLOW.md` | Full git + database workflow |
