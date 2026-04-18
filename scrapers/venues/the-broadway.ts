import 'dotenv/config'
import { chromium } from 'playwright'
import { extractShows } from '../lib/extract'
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

  const events = await page.$$eval('.eventlist-column-info', (nodes) =>
    nodes.map((node) => {
      const titleEl = node.querySelector('.eventlist-title-link')
      const title = titleEl?.textContent?.trim() ?? ''

      // Extract slug directly from Squarespace URL — e.g. /showcalendar/band-name-slug → band-name-slug
      const href = titleEl?.getAttribute('href') ?? ''
      const slug = href.split('/').filter(Boolean).pop() ?? ''

      const date = node.querySelector('time.event-date')?.getAttribute('datetime') ?? ''
      const time = node.querySelector('time.event-time-localized-start')?.textContent?.trim() ?? ''
      const image = node.querySelector('img[data-src]')?.getAttribute('data-src') ?? ''
      const bodyText = Array.from(node.querySelectorAll('.sqs-html-content p, .sqs-html-content h3'))
        .map((el) => el.textContent?.trim())
        .filter(Boolean)
        .join('\n')

      return `TITLE: ${title}\nSLUG: ${slug}\nDATE: ${date}\nTIME: ${time}\nIMAGE: ${image}\nDETAILS:\n${bodyText}`
    })
  )

  await browser.close()
  return events.join('\n\n---\n\n')
}

async function run() {
  console.log(`Scraping ${venue.name}...`)
  const raw = await scrape()
  const shows = await extractShows(raw, venue.name)
  for (const show of shows) {
    await ingestShow(show, venue)
  }
  console.log(`✓ ${shows.length} shows ingested`)
}

run().catch(console.error)
