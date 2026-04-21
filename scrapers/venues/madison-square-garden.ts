import '../lib/env'
import { chromium } from 'playwright'
import { extractShows, parseRawEvents } from '../lib/extract'
import { ingestShow } from '../lib/ingest'
import type { VenueConfig } from '../lib/types'

export const venue: VenueConfig = {
  name: 'Madison Square Garden',
  slug: 'madison-square-garden',
  url: 'https://www.ohmyrockness.com/venues/madison-square-garden',
}

function decodeTicketUrl(href: string): string {
  try {
    const u = new URL(href)
    return u.searchParams.get('u') ?? href
  } catch {
    return href
  }
}

const TM_FALLBACK_PATTERNS = ['TM_GenCatImgs', 'tmimages/TM_']

export async function scrape(): Promise<string> {
  const browser = await chromium.launch({ headless: process.env.HEADED !== '1' })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()
  await page.goto(venue.url, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.row.vevent', { timeout: 30000 })

  const rawCards = await page.$$eval('.row.vevent', (rows) =>
    rows.map((row) => {
      const iso =
        row.querySelector('.date.dtstart .value-title')?.getAttribute('title') ?? ''
      const time = row.querySelector('.date.dtstart .smaller')?.textContent?.trim() ?? ''
      const title = Array.from(row.querySelectorAll('.bands.summary a'))
        .map((a) => a.textContent?.trim() ?? '')
        .filter(Boolean)
        .join(', ')
      const moreInfo =
        row.querySelector('.tickets a.show-more-info')?.getAttribute('href') ?? ''
      const slug = moreInfo.match(/\/shows\/(.+?)(?:\/|$)/)?.[1] ?? ''
      const ticketHref =
        row.querySelector('.tickets a.ticketLink')?.getAttribute('href') ?? ''
      return { title, slug, iso, time, ticketHref }
    }),
  )

  console.log(`Madison Square Garden (OMR): ${rawCards.length} rows on list page`)

  // Dedup by OMR slug — list can contain duplicate entries for the same show.
  const bySlug = new Map<string, (typeof rawCards)[number]>()
  for (const c of rawCards) {
    if (!c.slug) continue
    if (bySlug.has(c.slug)) {
      console.warn(`  ⚠ Duplicate OMR slug on list page: ${c.slug}`)
      continue
    }
    bySlug.set(c.slug, c)
  }
  const unique = Array.from(bySlug.values())

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() + 3)

  const filtered = unique
    .filter(
      (c) =>
        c.title && c.slug && c.iso && c.ticketHref && new Date(c.iso) <= cutoff,
    )
    .map((c) => ({ ...c, ticketUrl: decodeTicketUrl(c.ticketHref) }))

  const limit = process.env.SCRAPE_LIMIT ? parseInt(process.env.SCRAPE_LIMIT) : Infinity
  const toProcess = filtered.slice(0, limit)

  const events: string[] = []
  for (const card of toProcess) {
    const detailPage = await context.newPage()
    try {
      await detailPage.goto(card.ticketUrl, { waitUntil: 'domcontentloaded' })

      // Open the event-details modal; TM only renders full info after click.
      // Price scraping skipped — TM's slider is flaky and slow.
      await detailPage
        .getByRole('button', { name: 'More Info' })
        .first()
        .click({ timeout: 15000 })
        .catch(() => {})
      await detailPage
        .waitForSelector('[data-bdd="event-details-content"]', { timeout: 15000 })
        .catch(() => {})

      const { image, description } = await detailPage.evaluate((fallbackPatterns) => {
        const isFallback = (src: string) =>
          !src || fallbackPatterns.some((p) => src.includes(p))

        const og =
          (document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null)
            ?.content ?? ''
        let image = isFallback(og) ? '' : og
        if (!image) {
          const lineup = Array.from(
            document.querySelectorAll('[data-bdd="lineup-list"] .event-details__lineup-img'),
          ) as HTMLImageElement[]
          const first = lineup.map((i) => i.src).find((s) => !isFallback(s))
          image = first ?? ''
        }

        const addl = document.querySelector('[data-bdd="event-details-info"]') as HTMLElement | null
        const note = document.querySelector('[data-bdd="please-note-section"]') as HTMLElement | null
        const source = addl ?? note
        const description = (source?.innerText ?? source?.textContent ?? '')
          .replace(/\r/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim()

        return { image, description }
      }, TM_FALLBACK_PATTERNS)

      events.push(
        `TITLE: ${card.title}\nSLUG: ${card.slug}\nDATE: ${card.iso}\nTIME: ${card.time}\nPRICE: \nGENRE: \nIMAGE: ${image}\nTICKET_URL: ${card.ticketUrl}\nDETAILS:\n${description}`,
      )
    } catch (err) {
      console.error(
        `  ✗ Failed detail for "${card.title}":`,
        err instanceof Error ? err.message : err,
      )
    } finally {
      await detailPage.close()
    }
  }

  await context.close()
  await browser.close()

  return events.join('\n\n---\n\n')
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
