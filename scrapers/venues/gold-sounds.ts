import '../lib/env'
import { chromium } from 'playwright'
import { extractShows, parseRawEvents } from '../lib/extract'
import { ingestShow } from '../lib/ingest'
import type { VenueConfig } from '../lib/types'

export const venue: VenueConfig = {
  name: 'Gold Sounds',
  slug: 'gold-sounds',
  url: 'https://dice.fm/venue/gold-sounds-y3qr',
}

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

// DICE list cards show dates in one of two locale-dependent forms:
//   US: "Wed, Apr 22" (month before day, with comma)
//   UK: "Wed 22 Apr" (day before month, no comma)
// Handle both. No year — infer: if month/day already passed, use next year.
function parseDiceCardDate(dateText: string): string {
  const usMatch = dateText.match(/([A-Z][a-z]{2})\s+(\d+)/)
  const ukMatch = dateText.match(/(\d+)\s+([A-Z][a-z]{2})/)
  let month = -1
  let day = NaN
  if (usMatch && MONTH_MAP[usMatch[1]] != null) {
    month = MONTH_MAP[usMatch[1]]
    day = parseInt(usMatch[2], 10)
  } else if (ukMatch && MONTH_MAP[ukMatch[2]] != null) {
    month = MONTH_MAP[ukMatch[2]]
    day = parseInt(ukMatch[1], 10)
  }
  if (month === -1 || isNaN(day)) return ''
  const now = new Date()
  const year =
    month < now.getMonth() || (month === now.getMonth() && day < now.getDate())
      ? now.getFullYear() + 1
      : now.getFullYear()
  return new Date(Date.UTC(year, month, day)).toISOString()
}

export async function scrape(): Promise<string> {
  const browser = await chromium.launch({ headless: process.env.HEADED !== '1' })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    // DICE formats dates per browser locale; lock to en-US so the parser
    // always sees "Wed, Apr 22" instead of "Wed 22 Apr".
    locale: 'en-US',
    timezoneId: 'America/New_York',
  })
  const page = await context.newPage()
  await page.goto(venue.url, { waitUntil: 'domcontentloaded' })
  // Wait for inner text (date span), not just the block — blocks can render as
  // skeletons before React hydrates the actual event data.
  await page.waitForSelector('[class*="EventParts__EventDate"]', { timeout: 30000 })

  const rawCards = await page.$$eval('[class*="EventParts__EventBlock"]', (blocks) =>
    blocks.map((block) => {
      const titleLink = block.querySelector(
        '[class*="EventParts__EventName"]',
      ) as HTMLAnchorElement | null
      const title = titleLink?.textContent?.trim() ?? ''
      const url = titleLink?.href ?? ''
      const slug = url.match(/\/event\/([^/?#]+)/)?.[1] ?? ''
      const dateText =
        block.querySelector('[class*="EventParts__EventDate"]')?.textContent?.trim() ?? ''
      const listPrice =
        block.querySelector('[class*="EventParts__EventPrice"]')?.textContent?.trim() ?? ''
      return { title, slug, url, dateText, listPrice }
    }),
  )

  console.log(`Gold Sounds (DICE): ${rawCards.length} events on list page`)

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() + 3)

  const withIso = rawCards.map((c) => ({ ...c, iso: parseDiceCardDate(c.dateText) }))
  const filtered = withIso.filter(
    (c) => c.title && c.slug && c.iso && new Date(c.iso) <= cutoff,
  )

  if (rawCards.length > 0 && filtered.length === 0) {
    console.warn(
      `  ⚠ All ${rawCards.length} cards filtered out. Sample card 0:`,
      JSON.stringify(withIso[0], null, 2),
    )
  }

  const limit = process.env.SCRAPE_LIMIT ? parseInt(process.env.SCRAPE_LIMIT) : Infinity
  const toProcess = filtered.slice(0, limit)

  const events: string[] = []
  for (const card of toProcess) {
    const detailPage = await context.newPage()
    try {
      await detailPage.goto(card.url, { waitUntil: 'domcontentloaded' })
      await detailPage
        .waitForSelector(
          '[class*="EventDetailsAbout__Text"], [class*="EventDetailsCallToAction__Price"]',
          { timeout: 15000 },
        )
        .catch(() => {})

      const { image, description, price, time, previewUrl, previewTrack } =
        await detailPage.evaluate(() => {
          const poster = document.querySelector(
            '[class*="EventDetailsImage__Container"] img',
          ) as HTMLImageElement | null
          const image = poster?.src ?? ''

          const paragraphs = Array.from(
            document.querySelectorAll('[class*="EventDetailsAbout__Text"] p'),
          )
            .map((p) => p.textContent?.trim() ?? '')
            .filter(Boolean)
          const description = paragraphs.join('\n\n')

          const priceSpan = document.querySelector(
            '[class*="EventDetailsCallToAction__Price"] span',
          )
          const price = priceSpan?.textContent?.trim() ?? ''

          // DICE header date block reads "Wed, Apr 22, 7:00 PM" — pull the time.
          const dateEl = document.querySelector('[class*="EventDetailsTitle__Date"]')
          const dateText = dateEl?.textContent?.trim() ?? ''
          const timeMatch = dateText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
          const time = timeMatch?.[1] ?? ''

          const audioSource = document.querySelector(
            '[class*="EventDetailsTopTrack__Container"] audio source',
          ) as HTMLSourceElement | null
          const previewUrl = audioSource?.src ?? ''
          const trackTitleEl = document.querySelector(
            '[class*="EventDetailsTopTrack__TrackTitle"]',
          )
          const previewTrack = trackTitleEl?.textContent?.trim() ?? ''

          return { image, description, price, time, previewUrl, previewTrack }
        })

      const finalPrice = price || card.listPrice

      events.push(
        `TITLE: ${card.title}\nSLUG: ${card.slug}\nDATE: ${card.iso}\nTIME: ${time}\nPRICE: ${finalPrice}\nGENRE: \nIMAGE: ${image}\nTICKET_URL: ${card.url}\nPREVIEW_URL: ${previewUrl}\nPREVIEW_TRACK: ${previewTrack}\nDETAILS:\n${description}`,
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
      show.previewUrl = scraped.previewUrl
      show.previewTrack = scraped.previewTrack
    }
    await ingestShow(show, venue)
  }
  console.log(`✓ ${shows.length} shows ingested`)
}

if (require.main === module) {
  run().catch(console.error)
}
