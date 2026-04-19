import '../lib/env'
import { chromium } from 'playwright'
import { extractShows, parseRawEvents } from '../lib/extract'
import { ingestShow } from '../lib/ingest'
import type { VenueConfig } from '../lib/types'

export const venue: VenueConfig = {
  name: 'Wonderville',
  slug: 'wonderville',
  url: 'https://www.wonderville.nyc/events',
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
      const time = node.querySelector('time.event-time-12hr-start')?.textContent?.trim() ?? ''

      const descWrap = node.querySelector('.eventlist-description')
      const img = descWrap?.querySelector('img')
      const image = img?.getAttribute('data-src') ?? img?.getAttribute('src') ?? ''

      const htmlBlocks = Array.from(descWrap?.querySelectorAll('.sqs-html-content') ?? [])
      const description = htmlBlocks
        .map((el) => (el as HTMLElement).innerText?.trim())
        .filter(Boolean)
        .join('\n\n')

      const rsvpBtn = descWrap?.querySelector('a.sqs-block-button-element')
      const ticketUrl = rsvpBtn?.getAttribute('href') ?? ''

      return { title, slug, href, date, time, image, description, ticketUrl }
    }),
  )

  console.log(`Wonderville: ${rawCards.length} events on list page`)

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() + 3)

  const withinWindow = rawCards.filter(
    (c) => c.title && c.slug && c.date && new Date(c.date) <= cutoff,
  )

  const limit = process.env.SCRAPE_LIMIT ? parseInt(process.env.SCRAPE_LIMIT) : Infinity
  const toProcess = withinWindow.slice(0, limit)

  await browser.close()

  return toProcess
    .map(
      (c) =>
        `TITLE: ${c.title}\nSLUG: ${c.slug}\nDATE: ${c.date}\nTIME: ${c.time}\nPRICE: \nGENRE: \nIMAGE: ${c.image}\nTICKET_URL: ${c.ticketUrl}\nDETAILS:\n${c.description}`,
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
