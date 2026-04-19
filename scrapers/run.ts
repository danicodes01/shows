import './lib/env'
import { venue as broadway, scrape as scrapeBroadway } from './venues/the-broadway'
import { venue as tvEye, scrape as scrapeTvEye } from './venues/tv-eye'
import { extractShows } from './lib/extract'
import { ingestShow } from './lib/ingest'
import type { VenueConfig } from './lib/types'

const scrapers: { venue: VenueConfig; scrape: () => Promise<string> }[] = [
  { venue: broadway, scrape: scrapeBroadway },
  { venue: tvEye, scrape: scrapeTvEye },
]

async function run() {
  for (const { venue, scrape } of scrapers) {
    console.log(`Scraping ${venue.name}...`)
    try {
      const raw = await scrape()
      const shows = await extractShows(raw, venue.name)
      for (const show of shows) {
        await ingestShow(show, venue)
      }
      console.log(`  ✓ ${shows.length} shows ingested`)
    } catch (err) {
      console.error(`  ✗ ${venue.name} failed:`, err)
    }
  }
}

run().catch(console.error)
