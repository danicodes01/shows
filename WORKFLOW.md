# DistortNewYork — Development Workflow

## Stack

- **Framework**: Next.js App Router (latest), TypeScript (loose)
- **Database**: Neon Postgres (serverless) via Prisma 7
- **ORM**: Prisma 7 — schema at `prisma/schema.prisma`
- **Styling**: CSS Modules, Apple dark mode color system
- **Hosting**: Vercel
- **Storage**: Vercel Blob (image uploads)

---

## Prerequisites

- Node.js installed
- Vercel CLI: `npm i -g vercel`
- GitHub account with access to the repo
- Added as collaborator on the Vercel project

---

## First Time Setup

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/shows.git
cd shows

# 2. Add upstream remote (main repo)
git remote add upstream git@github.com:distort-apps/DistortNewYork.git

# 3. Verify remotes
git remote -v
# origin    git@github.com:YOUR_USERNAME/shows.git
# upstream  git@github.com:distort-apps/DistortNewYork.git

# 4. Install dependencies
npm install

# 5. Set up environment variables
# Copy DATABASE_URL and DATABASE_URL_UNPOOLED from Neon console (console.neon.tech)
# Copy ANTHROPIC_API_KEY, INGEST_SECRET, BLOB_READ_WRITE_TOKEN from the team
# Create .env.local with all of these

# 6. Apply any pending migrations
npx prisma migrate dev

# 7. Start the dev server
npm run dev
```

---

## Daily Workflow

### 1. Sync with upstream before starting work

```bash
git checkout main
git pull upstream main
npm install
npx prisma migrate dev
```

### 2. Create a feature branch

```bash
# Always branch from main
# Naming: dev/feature-name, docs/what-changed, fix/bug-description
git checkout -b dev/your-feature-name
```

### 3. Make your changes

If you changed `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name describe-your-change
# This: creates migration file, applies it, regenerates Prisma client
```

If you only changed app code (no schema changes):

```bash
# No extra steps needed
npm run dev
```

### 4. Before pushing — sync, build, check

```bash
# Sync with latest main
git checkout main
git pull upstream main
git checkout dev/your-feature-name
git merge main

# Re-apply migrations in case main had schema changes
npx prisma migrate dev

# Reinstall in case main had new deps
npm install

# Build must pass before pushing
npm run build

# If build passes, push to your fork
git push origin dev/your-feature-name
```

### 5. Create a pull request

Push will print a GitHub URL — click it to open the PR.

- Set base branch to `main` on the upstream repo (`distort-apps/DistortNewYork`)
- Describe what changed and why
- Note if the PR includes a database migration

### 6. After your PR is merged

```bash
git checkout main
git pull upstream main
git branch -d dev/your-feature-name
npm install
npx prisma migrate dev
```

---

## Database

### Environments

**All environments share a single Neon database.** The Neon Vercel integration was removed (plan only allowed 1 branch). `DATABASE_URL` is set manually in Vercel for all environments.

| Environment | Database | How it's set |
|---|---|---|
| Production | Neon — single shared DB | Manually in Vercel env vars |
| Preview | Neon — same shared DB | Manually in Vercel env vars |
| Development | Neon — same shared DB | `.env.local` |

> ⚠️ No database isolation between environments. Scraper runs, migrations, and preview deployment writes all hit the same database. Be careful running scrapers — they write to live data.

### Key rules

- **Never** run `migrate dev` against production
- **Never** run `migrate deploy` locally
- `migrate dev` — local only, creates + applies + regenerates client
- `migrate deploy` — production only, runs in Vercel build step automatically

### Schema changes

```bash
# Edit the schema
vim prisma/schema.prisma

# Create and apply migration
npx prisma migrate dev --name describe-your-change

# Commit both the schema AND the migrations folder
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: describe your schema change"
```

### Useful database commands

```bash
npx prisma migrate dev              # Apply pending migrations + regenerate client
npx prisma migrate dev --name xyz   # Create new migration with name
npx prisma migrate status           # Check pending migrations
npx prisma generate                 # Regenerate client without migrating
npx prisma studio                   # Open database GUI in browser
```

---

## Environments & Deployments

| Branch | Vercel environment | Database |
|---|---|---|
| `main` | Production | Neon — single shared DB |
| Any other branch | Preview | Neon — same shared DB |
| Local | Development | Neon — same shared DB |

- Every push to a feature branch triggers a Vercel **preview deployment** automatically
- Merging to `main` triggers a **production deployment** automatically
- Production migrations (`prisma migrate deploy`) run as part of the Vercel build
- All environments share one database — preview deployments are not isolated from production data

---

## Project Structure

```
/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx          # Home — featured shows
│   ├── shows/            # All shows + date filter
│   │   └── [slug]/       # Show detail + comments
│   ├── search/           # Search (searchParams ?q=)
│   ├── venues/           # All venues
│   │   └── [slug]/       # Venue detail
│   ├── contact/          # Submit a show
│   └── api/
│       └── shows/        # Ingestion endpoint (scrapers POST here)
├── actions/              # Server Actions (mutations)
│   ├── comments.ts
│   ├── contact.ts
│   └── newsletter.ts
├── components/           # React components
├── lib/
│   ├── prisma.ts         # Prisma client singleton
│   ├── shows.ts          # DB query functions
│   └── generated/        # Auto-generated Prisma client (do not edit)
├── prisma/
│   ├── schema.prisma     # Database schema (source of truth)
│   └── migrations/       # Migration history (commit these)
├── styles/
│   └── globals.css       # Global styles + Apple dark mode CSS vars
└── public/
```

---

## Scrapers

Scrapers live in `scrapers/venues/`. Each one is a standalone script — run from the repo root with npm scripts. See `SCRAPERS.md` for full architecture details.

### Required env vars (in `.env` and `.env.local`)

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude Haiku for show extraction |
| `INGEST_URL` | Where to POST shows — set per environment (see below) |
| `INGEST_SECRET` | Bearer token that protects `/api/shows` |

### Running a scraper

```bash
# Populate local dev (requires npm run dev in another tab)
npm run scrape:broadway:dev

# Populate production
npm run scrape:broadway:prod
```

Shows without images are automatically skipped — the site is image-first.

### Adding a new venue

1. Create `scrapers/venues/venue-name.ts` — copy the-broadway.ts as a template
2. Add `"scrape:venue-name": "ts-node --project scrapers/tsconfig.json scrapers/venues/venue-name.ts"` to `package.json`
3. Test with `npm run scrape:venue-name`

### Duplicate handling

The ingestion endpoint upserts by slug — running a scraper twice is safe. Cancelled shows that disappear from the venue site will stay in the DB until manually removed via Prisma Studio (`npm run db:studio`).

### Data vs schema — no migration flow needed

- **Schema changes** — migrate locally, deploy automatically via Vercel build
- **Data (shows)** — each environment is independent. Point `INGEST_URL` at whichever environment you want to populate. No dev → staging → prod pipeline for data.

---

## CSS Variables (Apple Dark Mode)

Defined in `styles/globals.css`, use these everywhere — never hardcode colors.

```css
--color-bg              /* #000000 — page background */
--color-bg-elevated     /* #1C1C1E — cards, surfaces */
--color-bg-elevated-2   /* #2C2C2E — inputs, nested surfaces */
--color-text            /* #FFFFFF — primary text */
--color-text-secondary  /* rgba(235,235,245,0.6) — secondary text */
--color-text-tertiary   /* rgba(235,235,245,0.3) — tertiary text */
--color-accent          /* #BF5AF2 — systemPurple, links, borders */
--color-success         /* #30D158 — systemGreen */
--color-error           /* #FF453A — systemRed */
--color-separator       /* #38383A — borders, dividers */
--color-fill            /* rgba(120,120,128,0.36) — fills, hover states */
```

---

## Critical Rules

- ✅ Always sync with upstream before starting work
- ✅ Always run `npm run build` before pushing
- ✅ Commit `prisma/migrations/` whenever you change the schema
- ✅ Use specific `git add <file>` — avoid `git add .`
- ✅ Branch naming: `dev/feature`, `docs/what-changed`, `fix/bug`
- ❌ Never push directly to `main`
- ❌ Never run `migrate dev` against production
- ❌ Never hardcode colors — use CSS variables
