import '../lib/env'
import { chromium } from 'playwright'
import type { Frame, Page } from 'playwright'
import { extractShows, parseRawEvents } from '../lib/extract'
import { ingestShow } from '../lib/ingest'
import type { VenueConfig } from '../lib/types'

export const venue: VenueConfig = {
  name: 'Bar Freda',
  slug: 'bar-freda',
  url: 'https://www.ohmyrockness.com/venues/bar-freda',
}

function decodeTicketUrl(href: string): string {
  try {
    const u = new URL(href)
    return u.searchParams.get('u') ?? href
  } catch {
    return href
  }
}

// The VenuePilot widget can render directly on the page or inside a
// filesusr.com iframe — handle both.
async function findVpFrame(page: Page): Promise<Frame> {
  try {
    await page.waitForSelector('.vp-event-details-modal, .vp-main-img, .vp-event-description', {
      timeout: 5000,
    })
    return page.mainFrame()
  } catch {}
  const frame = page.frames().find((f) => f.url().includes('filesusr.com'))
  if (frame) {
    await frame
      .waitForSelector('.vp-event-details-modal, .vp-main-img, .vp-event-description', {
        timeout: 15000,
      })
      .catch(() => {})
    return frame
  }
  return page.mainFrame()
}

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

  console.log(`Bar Freda (OMR): ${rawCards.length} rows on list page`)

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() + 3)

  const filtered = rawCards
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
      const frame = await findVpFrame(detailPage)

      const { image, description } = await frame.evaluate(() => {
        const bg =
          (document.querySelector('.vp-main-img') as HTMLElement | null)?.style
            .backgroundImage ?? ''
        const image = bg.match(/url\(["']?([^"')]+)["']?\)/)?.[1] ?? ''

        const descRoot = document.querySelector('.vp-event-description > div')
        const paragraphs = Array.from(descRoot?.querySelectorAll('p') ?? [])
          .map((p) => p.textContent?.trim() ?? '')
          .filter(Boolean)
        const description = paragraphs.join('\n\n')

        return { image, description }
      })

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
