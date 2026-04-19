# Admin Section — Plan

Private admin dashboard at `/admin` for the site owner (Daniel) — not linked anywhere public, excluded from sitemap/robots, gated by simple credentials.

## Goals

1. Review and approve/reject submitted shows from the `Contact` table (the info/submit form writes to this table)
2. View all shows with rich filtering (by any field on `Show` + by venue)
3. Edit any field on a show (title, date, genre, time, price, image, excerpt, ticketUrl, isFeatured, rating)
4. Delete shows
5. Toggle `isFeatured` quickly from the list
6. Match the existing Apple dark-mode, CSS Modules, CSS Grid, mobile-first design language

## Non-goals

- Multi-tenant permissions, role levels, audit logs
- OAuth / SSO / magic links
- Full-featured CMS (we already have scrapers)
- Rate limiting or brute-force protection beyond Vercel's baseline (low traffic, obscure URL)

---

## Route structure

```
app/
  admin/
    layout.tsx              admin-only layout (sidebar nav, sign-out, wraps protected pages)
    page.tsx                dashboard (counts: shows, venues, pending contacts)
    login/page.tsx          login form (the only /admin/* route that bypasses the auth check)
    shows/
      page.tsx              filterable list of all shows
      [id]/page.tsx         edit show form
    contacts/
      page.tsx              list of submitted shows (PENDING by default, tabs for APPROVED/REJECTED)
      [id]/page.tsx         review a single submission (approve → promote to Show, reject → mark rejected)
    venues/
      page.tsx              list of venues (just table + counts, maybe rename/edit later)
  api/
    admin/
      logout/route.ts       clears session cookie
actions/
  admin/
    auth.ts                 login action (verifies credentials, sets cookie)
    shows.ts                update / delete / toggleFeatured / bulkDelete actions
    contacts.ts             approve (creates Show) / reject / delete contact actions
middleware.ts               protects /admin/** (redirects to /admin/login if no cookie)
```

**Important:** `/admin/login` must NOT be protected by middleware — otherwise we'd have an infinite redirect. The middleware should exclude it explicitly.

---

## Auth

Simple credential-based auth. No third-party provider. Store credentials in env vars.

### Env vars

```
ADMIN_USERNAME=dan
ADMIN_PASSWORD_HASH=<bcrypt hash>
ADMIN_SESSION_SECRET=<random 32+ byte hex for HMAC>
```

- Do NOT store plaintext password. Use `bcryptjs` (pure JS, works in edge/node) with a cost of 10.
- `openssl rand -hex 32` for `ADMIN_SESSION_SECRET`.

### Flow

1. User hits `/admin/...` → middleware checks for signed session cookie.
2. If missing/invalid → redirect to `/admin/login?next=<original-path>`.
3. Login form posts to server action `loginAction(username, password, next)`.
4. Server action:
   - Compares `username` to `ADMIN_USERNAME`
   - Compares `password` via `bcrypt.compare` to `ADMIN_PASSWORD_HASH`
   - On success: creates a signed token `${timestamp}.${hmac}` (HMAC-SHA256 using `ADMIN_SESSION_SECRET`, signing `timestamp:username`), sets HttpOnly, Secure, SameSite=Lax cookie with 7-day expiry.
   - On failure: returns a form error (keep generic — "Invalid credentials").
5. `logoutAction` clears the cookie.

### Why not NextAuth / Auth.js?
- Single user, single credential → library is overkill.
- Keeps deps small.
- If a second admin is ever needed, promote to a DB-backed `Admin` table with `email` + `passwordHash`, keep the same cookie/HMAC mechanism.

### Future-proofing for multiple users

If we ever need >1 admin: add an `Admin` model to `prisma/schema.prisma`:
```prisma
model Admin {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}
```
Login action queries by email, compares hash. Session token payload becomes `${adminId}:${timestamp}`.

---

## Hiding from search engines

1. **`robots.txt`** — add at `app/robots.ts` (or `public/robots.txt`):
   ```
   User-agent: *
   Disallow: /admin/
   ```
2. **Sitemap** — if/when we add `app/sitemap.ts`, explicitly exclude `/admin/*`.
3. **Per-page meta** — in `app/admin/layout.tsx` set `export const metadata = { robots: { index: false, follow: false } }`.
4. **No inbound links** from the public site. Never add an `<a href="/admin">` anywhere public.

Obscure URL + robots + noindex = good enough. Not a security mechanism (auth is), just SEO hygiene.

---

## Pages and UI

### `/admin` — Dashboard
- Counts: total shows, total venues, pending contacts, featured shows.
- Three action cards: "Review submissions" (with badge for pending count), "Manage shows", "Manage venues".
- Keep it minimal.

### `/admin/shows` — Show list with filters
Filter sidebar (left on desktop, collapsible on mobile) + table/grid (right).

**Filter fields** (all optional, combine via AND):
- `title` — text contains, case-insensitive
- `slug` — text contains
- `venue` — multi-select from all venues (checkboxes or a dropdown)
- `genre` — text contains (genres are free-form text)
- `date` — range: from/to date pickers
- `isFeatured` — tri-state: Any / Featured / Not featured
- `rating` — min/max numeric
- `hasImage` — boolean (image != '')
- `hasTicketUrl` — boolean
- `hasExcerpt` — boolean
- free-text search — single input that searches across title + excerpt + genre (like the public search)

State management:
- Filters live in URL query params (`?venue=tv-eye&genre=punk&featured=true&q=...&page=1`).
- Server Component reads `searchParams`, builds Prisma `where`, renders results.
- Filter form is a small Client Component that updates the URL via `router.push` on change (debounced for text inputs).
- Pagination same as `/shows` (numbered, 25 per page feels right for admin — more density than public).

**Table columns**:
- Title (links to `/admin/shows/[id]`)
- Venue
- Date
- Genre
- ⭐ (isFeatured toggle — inline Server Action)
- Rating
- Actions (Edit / Delete — delete confirms via `<dialog>` or simple `confirm()` for now)

Bulk select (checkboxes + "Delete selected" at top) is a nice-to-have but can skip initially.

### `/admin/shows/[id]` — Edit show
Standard form, all Show fields. Fields:
- title (text)
- slug (text, warn if changed — breaks URL)
- date (datetime-local)
- time (text)
- genre (text)
- price (text)
- venue (select from existing venues)
- image (text URL + preview thumbnail)
- excerpt (textarea)
- ticketUrl (text)
- rating (number 0-5)
- isFeatured (checkbox)

Save → Server Action, redirect back to `/admin/shows` with success flash (use cookie-based flash or query param).
Delete button → confirm, Server Action, redirect to list.

### `/admin/contacts` — Submissions
Table of `Contact` rows.
- Tabs: Pending (default) / Approved / Rejected / All (filtered via `?status=PENDING`)
- Columns: submitted-at, title, date, venue, email, status, Actions
- Click row → `/admin/contacts/[id]`

### `/admin/contacts/[id]` — Review submission
Shows all fields from the Contact.
Actions:
- **Approve** → server action that:
  1. Upserts the venue (looks up by name, creates if missing)
  2. Creates a new Show row from the Contact fields (needs slug generation)
  3. Uploads `imageUrl` as-is (already in Vercel Blob since the form uses it)
  4. Marks Contact as APPROVED
  5. Redirects to the new show's edit page so admin can fine-tune
- **Reject** → marks Contact as REJECTED, redirects back to list
- **Delete** → hard-deletes the Contact row

Slug generation: `slugify(title)` — same as scrapers. Collision: append `-2`, `-3`, etc. if slug exists.

### `/admin/venues` — Venues
Simple table of venues. Counts of shows per venue. Rename/edit later if needed. Low priority.

---

## Design language

Match existing patterns (see `CLAUDE.md` and `styles/globals.css`):
- **CSS Modules** per component, no Tailwind.
- **CSS Grid** for layout (sidebar + main on desktop, stacked on mobile — mobile-first).
- **CSS variables** from `globals.css` — no hardcoded colors.
- Admin-specific accents: reuse `--color-accent` (purple) for active states, `--color-success` for approve, `--color-error` for reject/delete.
- Tables: zebra rows using `var(--color-bg-elevated)` and `var(--color-bg-elevated-2)`, thin borders via `var(--color-separator)`, tabular-nums for numeric columns, sticky header on scroll.
- Forms: inputs use the `--color-input-*` variables already in `globals.css`.
- Icons: stick with the existing pattern (inline SVG or simple text symbols — avoid adding an icon library).
- Keep layouts dense but padded; admin can afford more information density than the public site.

---

## Files to add

**New:**
- `middleware.ts` — auth check for `/admin/**`
- `app/robots.ts`
- `app/admin/layout.tsx` + `layout.module.css`
- `app/admin/page.tsx`
- `app/admin/login/page.tsx` + `login.module.css`
- `app/admin/shows/page.tsx` + `shows.module.css`
- `app/admin/shows/[id]/page.tsx` + `edit.module.css`
- `app/admin/contacts/page.tsx` + styles
- `app/admin/contacts/[id]/page.tsx` + styles
- `app/admin/venues/page.tsx` + styles
- `app/api/admin/logout/route.ts`
- `actions/admin/auth.ts`
- `actions/admin/shows.ts`
- `actions/admin/contacts.ts`
- `lib/admin/session.ts` — signing, verifying, reading cookie
- `components/admin/filter-panel.tsx` (client)
- `components/admin/show-table.tsx`
- `components/admin/admin-nav.tsx`

**Modified:**
- `package.json` — add `bcryptjs`, `@types/bcryptjs`
- Existing `lib/shows.ts` — maybe add `getShowsForAdmin(filters, page)` that doesn't enforce `date >= today` (admin sees past shows too)

---

## Build order (suggested incremental PRs)

1. **Auth skeleton**
   - `middleware.ts`, login page, login action, logout route, session lib
   - Robots.txt + noindex meta
   - Bare `/admin` dashboard that just says "You're in"
2. **Shows list + filters**
   - `getShowsForAdmin`, filter panel, show table
   - URL-param-driven filtering + pagination
3. **Show edit + delete + toggle featured**
   - Edit page + form
   - Toggle-featured server action (inline in list)
   - Delete with confirmation
4. **Contacts review**
   - List + per-status tabs
   - Approve action (creates Show + marks contact)
   - Reject / delete
5. **Dashboard polish**
   - Real counts, pending-badge, links
6. **Venues page** (low priority)

---

## Open questions to resolve before implementation

1. **Session storage:** signed stateless cookie (proposed) vs DB-backed session table. Stateless is simpler; DB-backed lets us invalidate all sessions on password change. → Start stateless; revisit if we get multi-admin.
2. **Password reset:** out of scope. If Daniel loses the password, rotate the env var and redeploy.
3. **Slug edits on shows:** allowed or blocked? If allowed, existing links break and there's no redirect. → Allow it but show a warning. Skip redirect handling for now.
4. **Date display:** admin sees all shows (including past) for history. Public filter (`gte today`) does not apply in admin.
5. **`SCRAPE_LIMIT`-style behavior for listing:** default 25 per page? 50? → Start 25.
6. **Bulk actions:** defer to a later iteration unless the list gets painful.

---

## Context for the next session

- **Current state (2026-04-18):** `main` branch has App Router + Neon Postgres + Prisma 7 migration complete. Scrapers work for TV Eye, Broadway, Brooklyn Monarch, Market Hotel, Wonderville. Cron at `/api/cron/delete-past-shows` deletes past shows daily at 9am UTC. Public `/shows` paginates 12 per page; homepage shows ≤8 featured.
- **Single shared Neon DB** across dev/preview/prod (no branching). Any schema change via `prisma migrate dev` immediately hits prod DB; Vercel build's `prisma migrate deploy` is just a safety net.
- **Existing auth:** none anywhere in the app.
- **Relevant files to read first:**
  - `CLAUDE.md` — project conventions
  - `prisma/schema.prisma` — full data model (Show, Venue, Comment, Newsletter, Contact)
  - `lib/shows.ts` — existing query patterns
  - `actions/contact.ts` — how the public submission form writes to `Contact`
  - `styles/globals.css` — CSS variable system

Keep it boring. Ship iteratively. Don't over-engineer.
