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
│   ├── the-broadway.ts # Squarespace-based calendar
│   └── tv-eye.ts       # SeeTickets-based calendar
└── run.ts              # runs all scrapers in sequence
```

---

## Running Scrapers

Run individually from the project root. Each venue has three scripts — pick the target environment:

```bash
npm run scrape:broadway
npm run scrape:tv-eye
```

---

## How It Works

1. **Playwright** navigates the venue's calendar page and scrapes list-level data (title, slug, date, time, price, genre, image)
2. **Playwright** visits each event's detail page for the full description and best-quality image
3. **Claude Haiku** receives all raw event data as formatted text blocks and extracts structured JSON
4. **ingest.ts** POSTs each show to `/api/shows` with a bearer token — upserts by slug, safe to re-run

---

## Adding a New Venue

1. Create `scrapers/venues/venue-name.ts` — export `venue: VenueConfig` and `scrape(): Promise<string>`
2. Add it to the scrapers array in `scrapers/run.ts`
3. Add an npm script in `package.json`:
   ```json
   "scrape:venue-name": "ts-node --project scrapers/tsconfig.json scrapers/venues/venue-name.ts"
   ```

The only venue-specific code is Playwright DOM extraction. Everything else (Haiku call, ingest POST) is shared.

---

## Scraper Rules

### Always visit the detail page
Never rely on the list page alone for the event description. List pages often truncate or omit details entirely. Always open each event's detail page and pull the full description text.

### Preserve the full description — don't summarize
The `excerpt` field should contain the complete event details text, preserving paragraph breaks as `\n\n`. Haiku is instructed to pass it through as-is. This content populates the show's detail page on the site and is community-facing.

### Use the full-size image
Some ticketing platforms (e.g. SeeTickets) wrap event images in an `<a>` tag where the `href` is the original and the `img src` is a resized/compressed thumbnail. Always grab the `<a href>` for the full-size image.

### Detect and skip venue fallback images
Venues often have a generic fallback image for events with no uploaded art. Identify its filename and filter those events out before passing to Haiku — the site is image-first and generic logos look bad on show cards.

Example:
```typescript
const VENUE_FALLBACK = 'tv-eye-e1673392710636.jpeg'
.filter((c) => !c.image.includes(VENUE_FALLBACK))
```

### Cap scraping to 3 months out
Only scrape shows within 3 months of today. Filter in Node after extracting list data, before visiting any detail pages — no point loading detail pages for shows that won't be ingested.

```typescript
const cutoff = new Date()
cutoff.setMonth(cutoff.getMonth() + 3)
.filter((c) => c.date && new Date(c.date) <= cutoff)
```

### Resolve partial dates before sending to Haiku
Some venues (e.g. SeeTickets) provide dates like "Tue Jun 16" with no year. Resolve the year in Node before building the raw text — don't ask Haiku to guess. Logic: if the month/day has already passed this year, use next year.

```typescript
const year =
  month < now.getMonth() || (month === now.getMonth() && day < now.getDate())
    ? now.getFullYear() + 1
    : now.getFullYear()
```

### Use `networkidle` for list pages, `domcontentloaded` for detail pages
List pages often use JS-rendered widgets (SeeTickets, etc.) that need network activity to settle. Detail pages are typically server-rendered — `domcontentloaded` is faster and sufficient.

### Handle detail page failures gracefully
Wrap each detail page visit in try/catch/finally. Log the failure and close the page — don't let one bad event crash the whole scrape run.

```typescript
try {
  // scrape detail
} catch (err) {
  console.error(`  ✗ Failed to load detail page for "${card.title}":`, err)
} finally {
  await detailPage.close()
}
```

### Slugs are the deduplication key
The ingest endpoint upserts by slug. Re-running a scraper is always safe. Make sure slugs are stable across runs — derive them from the venue's own URL structure, not from titles (which can change).

---

## Venue Reference

| Venue | Platform | Calendar URL | Detail page selector |
|---|---|---|---|
| The Broadway | Squarespace | `/showcalendar` | `.eventitem-column-content .sqs-html-content` (multiple blocks, joined) |
| TV Eye | SeeTickets | `/calendar/` | `.event-details` (on `wl.seetickets.us`) |

---

## Required Env Vars

| Var | Where |
|---|---|
| `ANTHROPIC_API_KEY` | `.env.local` |
| `INGEST_SECRET` | `.env.local` (must match Vercel env var) |
| `INGEST_URL` | Set per script or via env |
