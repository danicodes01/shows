import '../lib/env'
import { chromium } from 'playwright'
import { extractShows, parseRawEvents } from '../lib/extract'
import { ingestShow } from '../lib/ingest'
import type { VenueConfig } from '../lib/types'

export const venue: VenueConfig = {
  name: 'The Broadway',
  slug: 'the-broadway',
  url: 'https://www.thebroadway.nyc/showcalendar',
}

export async function scrape(): Promise<string> {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(venue.url, { waitUntil: 'networkidle' })

  const rawCards = await page.$$eval('.eventlist-column-info', (nodes) =>
    nodes.map((node) => {
      const titleEl = node.querySelector('.eventlist-title-link')
      const title = titleEl?.textContent?.trim() ?? ''
      const href = titleEl?.getAttribute('href') ?? ''
      const slug = href.split('/').filter(Boolean).pop() ?? ''
      const date = node.querySelector('time.event-date')?.getAttribute('datetime') ?? ''
      const time = node.querySelector('time.event-time-localized-start')?.textContent?.trim() ?? ''
      return { title, slug, href, date, time }
    })
  )

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() + 3)
  const withinWindow = rawCards.filter((c) => c.date && new Date(c.date) <= cutoff)

  const limit = process.env.SCRAPE_LIMIT ? parseInt(process.env.SCRAPE_LIMIT) : Infinity
  const toProcess = withinWindow.slice(0, limit)

  // Visit each event detail page for the image and full description
  // Broadway uses multiple .sqs-html-content blocks — collect all, join in order
  const events: string[] = []
  for (const card of toProcess) {
    const detailUrl = `https://www.thebroadway.nyc${card.href}`
    const detailPage = await browser.newPage()
    try {
      await detailPage.goto(detailUrl, { waitUntil: 'domcontentloaded' })
      const { image, description } = await detailPage.evaluate(() => {
        const blocks = Array.from(
          document.querySelectorAll('.eventitem-column-content [data-sqsp-block="text"] .sqs-html-content')
        )
        const description = blocks
          .map((el) => (el as HTMLElement).innerText?.trim())
          .filter(Boolean)
          .join('\n\n')
        const image =
          document.querySelector('.sqs-block-image img[data-src]')?.getAttribute('data-src') ?? ''
        return { image, description }
      })
      events.push(
        `TITLE: ${card.title}\nSLUG: ${card.slug}\nDATE: ${card.date}\nTIME: ${card.time}\nIMAGE: ${image}\nDETAILS:\n${description}`
      )
    } catch (err) {
      console.error(`  ✗ Failed to load detail page for "${card.title}":`, err)
    } finally {
      await detailPage.close()
    }
  }

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
