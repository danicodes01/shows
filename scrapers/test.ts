import './lib/env'

process.env.SCRAPE_LIMIT = '6'

import { venue as broadway, scrape as scrapeBroadway } from './venues/the-broadway'
import { venue as tvEye, scrape as scrapeTvEye } from './venues/tv-eye'
import { extractShows } from './lib/extract'

const scrapers = [
  { venue: broadway, scrape: scrapeBroadway },
  { venue: tvEye, scrape: scrapeTvEye },
]

async function test() {
  for (const { venue, scrape } of scrapers) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: ${venue.name}`)
    console.log('='.repeat(60))

    const raw = await scrape()

    console.log('\n--- RAW OUTPUT ---')
    console.log(raw)

    console.log('\n--- HAIKU EXTRACTION ---')
    const shows = await extractShows(raw, venue.name)
    console.log(JSON.stringify(shows, null, 2))
    console.log(`\n✓ ${shows.length} shows extracted`)
  }
}

test().catch(console.error)
