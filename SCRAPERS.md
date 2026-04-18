# DistortNewYork — Scrapers

Show data is collected by scrapers in the `scrapers/` folder. Playwright handles navigation, Claude Haiku converts raw page text into structured JSON, and the result is POSTed to `/api/shows`.

**Cost estimate: ~$0.04/run** across all venues using Claude Haiku.

---

## Folder Structure

```
scrapers/
├── lib/
│   ├── types.ts        # VenueConfig, ScrapedShow types
│   ├── extract.ts      # Claude Haiku call — shared by all scrapers
│   └── ingest.ts       # POST to /api/shows — shared by all scrapers
├── venues/
│   └── the-broadway.ts # one file per venue
└── run.ts              # runs all scrapers in sequence
```

---

## Running Scrapers

Run individually from the project root. Each venue has three scripts — pick the target environment:

```bash
# Against local dev server (must be running on port 3000)
npm run scrape:broadway:dev

# Against production
npm run scrape:broadway:prod

# Custom env (set INGEST_URL yourself)
npm run scrape:broadway
```

---

## How It Works

1. **Playwright** navigates the venue's shows page and grabs `document.body.innerText`
2. **Claude Haiku** extracts structured show JSON from the raw text
3. **ingest.ts** POSTs each show to `/api/shows` with a bearer token — upserts by slug, safe to re-run

---

## Adding a New Venue

1. Create `scrapers/venues/venue-name.ts` — export `venue: VenueConfig` and `scrape(): Promise<string>`
2. Add it to the scrapers array in `scrapers/run.ts`
3. Add npm scripts in `package.json`:
   ```json
   "scrape:venue-name:dev": "INGEST_URL=http://localhost:3000/api/shows ts-node --project scrapers/tsconfig.json scrapers/venues/venue-name.ts",
   "scrape:venue-name:prod": "INGEST_URL=https://distortnewyork.com/api/shows ts-node --project scrapers/tsconfig.json scrapers/venues/venue-name.ts"
   ```

The only venue-specific code is the Playwright navigation. Everything else is shared.

---

## Required Env Vars

| Var | Where |
|---|---|
| `ANTHROPIC_API_KEY` | `.env.local` |
| `INGEST_SECRET` | `.env.local` (must match Vercel env var) |
| `INGEST_URL` | Set per script or via env |
