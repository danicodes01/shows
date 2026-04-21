import './lib/env'
import { venue as broadway, scrape as scrapeBroadway } from './venues/the-broadway'
import { venue as tvEye, scrape as scrapeTvEye } from './venues/tv-eye'
import { venue as elsewhere, scrape as scrapeElsewhere } from './venues/elsewhere'
import { venue as paramount, scrape as scrapeParamount } from './venues/paramount'
import { venue as unionPool, scrape as scrapeUnionPool } from './venues/union-pool'
import { venue as alphaville, scrape as scrapeAlphaville } from './venues/alphaville'
import { venue as knockdown, scrape as scrapeKnockdown } from './venues/knockdown-center'
import { venue as purgatory, scrape as scrapePurgatory } from './venues/purgatory'
import { venue as berlin, scrape as scrapeBerlin } from './venues/berlin'
import { venue as barFreda, scrape as scrapeBarFreda } from './venues/bar-freda'
import { venue as transPecos, scrape as scrapeTransPecos } from './venues/trans-pecos'
import { venue as houseOfYes, scrape as scrapeHouseOfYes } from './venues/house-of-yes'
import { venue as goldSounds, scrape as scrapeGoldSounds } from './venues/gold-sounds'
import { venue as msg, scrape as scrapeMsg } from './venues/madison-square-garden'
import { extractShows } from './lib/extract'
import { ingestShow } from './lib/ingest'
import type { VenueConfig } from './lib/types'

const scrapers: { venue: VenueConfig; scrape: () => Promise<string> }[] = [
  { venue: broadway, scrape: scrapeBroadway },
  { venue: tvEye, scrape: scrapeTvEye },
  { venue: elsewhere, scrape: scrapeElsewhere },
  { venue: paramount, scrape: scrapeParamount },
  { venue: unionPool, scrape: scrapeUnionPool },
  { venue: alphaville, scrape: scrapeAlphaville },
  { venue: knockdown, scrape: scrapeKnockdown },
  { venue: purgatory, scrape: scrapePurgatory },
  { venue: berlin, scrape: scrapeBerlin },
  { venue: barFreda, scrape: scrapeBarFreda },
  { venue: transPecos, scrape: scrapeTransPecos },
  { venue: houseOfYes, scrape: scrapeHouseOfYes },
  { venue: goldSounds, scrape: scrapeGoldSounds },
  { venue: msg, scrape: scrapeMsg },
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
