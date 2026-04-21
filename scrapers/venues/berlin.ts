import '../lib/env'
import { chromium } from 'playwright'
import { extractShows, parseRawEvents } from '../lib/extract'
import { ingestShow } from '../lib/ingest'
import type { VenueConfig } from '../lib/types'

export const venue: VenueConfig = {
  name: 'Berlin',
  slug: 'berlin',
  url: 'https://www.ohmyrockness.com/venues/berlin',
}

function decodeTicketUrl(href: string): string {
  try {
    const u = new URL(href)
    return u.searchParams.get('u') ?? href
  } catch {
    return href
  }
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

  console.log(`Berlin (OMR): ${rawCards.length} rows on list page`)

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
      await detailPage
        .waitForSelector('script[type="application/ld+json"]', { timeout: 15000 })
        .catch(() => {})

      const { image, price } = await detailPage.evaluate(() => {
        // TicketWeb ships a structured Event schema — use it over DOM scraping.
        const scripts = Array.from(
          document.querySelectorAll('script[type="application/ld+json"]'),
        )
        let event: Record<string, unknown> | null = null
        for (const s of scripts) {
          try {
            const data = JSON.parse(s.textContent ?? '') as Record<string, unknown>
            if (data['@type'] === 'Event') {
              event = data
              break
            }
          } catch {}
        }

        const ogImage =
          (document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null)
            ?.content ?? ''
        const image = (typeof event?.image === 'string' ? event.image : '') || ogImage

        let price = ''
        const offers = event?.offers as { price?: string | number } | undefined
        if (offers?.price != null) {
          const num = typeof offers.price === 'number' ? offers.price : parseFloat(offers.price)
          if (!isNaN(num)) price = `$${num.toFixed(2)}`
        }

        return { image, price }
      })

      events.push(
        `TITLE: ${card.title}\nSLUG: ${card.slug}\nDATE: ${card.iso}\nTIME: ${card.time}\nPRICE: ${price}\nGENRE: \nIMAGE: ${image}\nTICKET_URL: ${card.ticketUrl}\nDETAILS:`,
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
