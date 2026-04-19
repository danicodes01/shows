import '../lib/env'
import { chromium } from 'playwright'
import { extractShows, parseRawEvents } from '../lib/extract'
import { ingestShow } from '../lib/ingest'
import type { VenueConfig } from '../lib/types'

export const venue: VenueConfig = {
  name: 'Brooklyn Monarch',
  slug: 'brooklyn-monarch',
  url: 'https://www.thebrooklynmonarch.com/shows',
}

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

function toISO(dateStr: string): string {
  const match = dateStr.match(/([A-Z][a-z]{2})\s+(\d+)/)
  if (!match) return ''
  const month = MONTH_MAP[match[1]] ?? -1
  const day = parseInt(match[2], 10)
  if (month === -1 || isNaN(day)) return ''
  const now = new Date()
  const year =
    month < now.getMonth() || (month === now.getMonth() && day < now.getDate())
      ? now.getFullYear() + 1
      : now.getFullYear()
  return new Date(Date.UTC(year, month, day)).toISOString()
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function scrape(): Promise<string> {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()
  await page.goto(venue.url, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('iframe[src*="filesusr.com"]', { timeout: 30000 })

  const listFrame = page.frames().find((f) => f.url().includes('filesusr.com'))
  if (!listFrame) throw new Error('Could not find filesusr iframe on Monarch shows page')
  await listFrame.waitForSelector('a[href*="kydlabs.com/e/"]', { timeout: 30000 })

  const rawCards = await listFrame.$$eval('a[href*="kydlabs.com/e/"]', (anchors) =>
    anchors
      .filter((a) => !!a.querySelector('h3'))
      .map((a) => {
        const href = a.getAttribute('href') ?? ''
        const title = a.querySelector('h3')?.textContent?.trim() ?? ''
        const smallDivs = Array.from(a.querySelectorAll('div.text-sm'))
        const dateText = smallDivs[0]?.textContent?.trim() ?? ''
        const subvenue = smallDivs[1]?.querySelector('div')?.textContent?.trim() ?? ''
        const image = a.querySelector('img')?.getAttribute('src') ?? ''
        return { href, title, dateText, subvenue, image }
      }),
  )

  const byHref = new Map<string, (typeof rawCards)[number]>()
  for (const c of rawCards) if (c.href && c.title) byHref.set(c.href, c)
  const unique = Array.from(byHref.values())
  console.log(`Brooklyn Monarch: ${unique.length} events on list page`)

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() + 3)

  const withDate = unique
    .map((c) => ({
      ...c,
      date: toISO(c.dateText),
      time: c.dateText.split(/\s*[-–—]\s*/)[1]?.trim() ?? '',
      slug: slugify(c.title),
    }))
    .filter((c) => c.date && new Date(c.date) <= cutoff && c.slug)

  const limit = process.env.SCRAPE_LIMIT ? parseInt(process.env.SCRAPE_LIMIT) : Infinity
  const toProcess = withDate.slice(0, limit)

  const events: string[] = []
  for (const card of toProcess) {
    const detailPage = await browser.newPage()
    try {
      await detailPage.goto(card.href, { waitUntil: 'domcontentloaded' })
      await detailPage.waitForSelector('.editor-container', { timeout: 10000 }).catch(() => {})
      const { description, price } = await detailPage.evaluate(() => {
        const descEl = document.querySelector('.editor-container.readonly')
        const description = (descEl?.textContent ?? '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
        const priceTexts = Array.from(document.querySelectorAll('td p, td span'))
          .map((el) => el.textContent?.trim() ?? '')
          .filter((t) => /^\$\d/.test(t))
        return { description, price: priceTexts[0] ?? '' }
      })
      const details = [card.subvenue && `Venue: ${card.subvenue}`, description].filter(Boolean).join('\n\n')
      events.push(
        `TITLE: ${card.title}\nSLUG: ${card.slug}\nDATE: ${card.date}\nTIME: ${card.time}\nPRICE: ${price}\nGENRE: \nIMAGE: ${card.image}\nTICKET_URL: ${card.href}\nDETAILS:\n${details}`,
      )
    } catch (err) {
      console.error(`  ✗ Failed detail: "${card.title}":`, err instanceof Error ? err.message : err)
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
    }
    await ingestShow(show, venue)
  }
  console.log(`✓ ${shows.length} shows ingested`)
}

if (require.main === module) {
  run().catch(console.error)
}
