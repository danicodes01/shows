import 'dotenv/config'
import { venue, scrape } from './venues/the-broadway'
import { extractShows } from './lib/extract'

async function test() {
  console.log(`Scraping ${venue.name}...`)
  const raw = await scrape()
  console.log('\n--- RAW OUTPUT (first 500 chars) ---')
  console.log(raw.slice(0, 500))
  console.log('\n--- EXTRACTING WITH HAIKU ---')
  const shows = await extractShows(raw, venue.name)
  console.log(JSON.stringify(shows, null, 2))
  console.log(`\n✓ ${shows.length} shows extracted`)
}

test().catch(console.error)
