import '../lib/env'
import { chromium } from 'playwright'
import { extractShows, parseRawEvents } from '../lib/extract'
import { ingestShow } from '../lib/ingest'
import type { VenueConfig } from '../lib/types'

export const venue: VenueConfig = {
  name: 'Knockdown Center',
  slug: 'knockdown-center',
  url: 'https://www.ohmyrockness.com/venues/knockdown-center',
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

  console.log(`Knockdown Center (OMR): ${rawCards.length} rows on list page`)

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
        .waitForSelector(
          '[class*="EventDetailsAbout__Text"], [class*="EventDetailsCallToAction__Price"]',
          { timeout: 15000 },
        )
        .catch(() => {})

      const { image, description, price, previewUrl, previewTrack } = await detailPage.evaluate(() => {
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

        const audioSource = document.querySelector(
          '[class*="EventDetailsTopTrack__Container"] audio source',
        ) as HTMLSourceElement | null
        const previewUrl = audioSource?.src ?? ''
        const trackTitleEl = document.querySelector(
          '[class*="EventDetailsTopTrack__TrackTitle"]',
        )
        const previewTrack = trackTitleEl?.textContent?.trim() ?? ''

        return { image, description, price, previewUrl, previewTrack }
      })

      events.push(
        `TITLE: ${card.title}\nSLUG: ${card.slug}\nDATE: ${card.iso}\nTIME: ${card.time}\nPRICE: ${price}\nGENRE: \nIMAGE: ${image}\nTICKET_URL: ${card.ticketUrl}\nPREVIEW_URL: ${previewUrl}\nPREVIEW_TRACK: ${previewTrack}\nDETAILS:\n${description}`,
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
