import './lib/env'

process.env.SCRAPE_LIMIT = '6'

import { venue, scrape } from './venues/tv-eye'
import { extractShows } from './lib/extract'

async function test() {
  console.log(`Testing: ${venue.name}`)
  const raw = await scrape()
  console.log('\n--- RAW OUTPUT ---')
  console.log(raw)
  console.log('\n--- HAIKU EXTRACTION ---')
  const shows = await extractShows(raw, venue.name)
  console.log(JSON.stringify(shows, null, 2))
  console.log(`\n✓ ${shows.length} shows extracted`)
}

test().catch(console.error)
