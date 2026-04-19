import '../lib/env'
import { chromium } from 'playwright'
import { extractShows, parseRawEvents } from '../lib/extract'
import { ingestShow } from '../lib/ingest'
import type { VenueConfig } from '../lib/types'

export const venue: VenueConfig = {
  name: 'Market Hotel',
  slug: 'market-hotel',
  url: 'https://www.markethotel.org/calendar#/events',
}

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

function toISO(monthDay: string): string {
  const match = monthDay.match(/([A-Z][a-z]{2})\s+(\d+)/)
  if (!match) return ''
  const month = MONTH_MAP[match[1]] ?? -1
  const day = parseInt(match[2], 10)
  if (month === -1 || isNaN(day)) return ''
  const now = new Date()
  const year =
    month < now.getMonth() || (month === now.getMonth() && day < now.getDate())
      ? now.getFullYear() + 1
      : now.getFullYear()
  return new Date(Date.UTC(year, month, day)).toISOString()
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function scrape(): Promise<string> {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()
  await page.goto(venue.url, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.vp-event-row', { timeout: 30000 })

  const rawCards = await page.$$eval('.vp-event-row', (rows) =>
    rows.map((row) => {
      const anchor = row.querySelector('a.vp-event-link')
      const href = anchor?.getAttribute('href') ?? ''
      const eventId = href.match(/#\/events\/(\d+)/)?.[1] ?? ''
      const title = row.querySelector('.vp-event-name')?.textContent?.trim() ?? ''
      const monthDay = row.querySelector('.vp-month-n-day')?.textContent?.trim() ?? ''
      const time = row.querySelector('.vp-time')?.textContent?.trim() ?? ''
      const bg = (row.querySelector('.vp-main-img') as HTMLElement | null)?.style.backgroundImage ?? ''
      const image = bg.match(/url\(["']?([^"')]+)["']?\)/)?.[1] ?? ''
      return { eventId, title, monthDay, time, image }
    }),
  )

  const byId = new Map<string, (typeof rawCards)[number]>()
  for (const c of rawCards) if (c.eventId && c.title) byId.set(c.eventId, c)
  const unique = Array.from(byId.values())
  console.log(`Market Hotel: ${unique.length} events on list page`)

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() + 3)

  const withDate = unique
    .map((c) => ({
      ...c,
      date: toISO(c.monthDay),
      slug: slugify(c.title),
      ticketUrl: `https://www.markethotel.org/calendar#/events/${c.eventId}`,
    }))
    .filter((c) => c.date && new Date(c.date) <= cutoff && c.slug)

  const limit = process.env.SCRAPE_LIMIT ? parseInt(process.env.SCRAPE_LIMIT) : Infinity
  const toProcess = withDate.slice(0, limit)

  await context.close()
  await browser.close()

  return toProcess
    .map(
      (c) =>
        `TITLE: ${c.title}\nSLUG: ${c.slug}\nDATE: ${c.date}\nTIME: ${c.time}\nPRICE: \nGENRE: \nIMAGE: ${c.image}\nTICKET_URL: ${c.ticketUrl}\nDETAILS:`,
    )
    .join('\n\n---\n\n')
}

async function run() {
  console.log(`Scraping ${venue.name}...`)
  const raw = await scrape()
  const bySlug = parseRawEvents(raw)
  const shows = await extractShows(raw, venue.name)
  for (const show of shows) {
    const scraped = bySlug.get(show.slug)
    if (scraped) {
      show.image = scraped.image
      show.ticketUrl = scraped.ticketUrl
    }
    await ingestShow(show, venue)
  }
  console.log(`✓ ${shows.length} shows ingested`)
}

if (require.main === module) {
  run().catch(console.error)
}
