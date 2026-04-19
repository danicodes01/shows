import '../lib/env'
import { chromium } from 'playwright'
import { extractShows, parseRawEvents } from '../lib/extract'
import { ingestShow } from '../lib/ingest'
import type { VenueConfig } from '../lib/types'

export const venue: VenueConfig = {
  name: 'TV Eye',
  slug: 'tv-eye',
  url: 'https://tveyenyc.com/calendar/',
}

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

// TV Eye's See Tickets widget sometimes embeds a broken bucket (prod-sph)
// inside the base64 payload — swap to the working bucket (prod-sih).
function fixSeeTicketsImage(url: string): string {
  const match = url.match(/^(https:\/\/prod-images\.seetickets\.us\/)([A-Za-z0-9+/=]+)$/)
  if (!match) return url
  try {
    const decoded = Buffer.from(match[2], 'base64').toString('utf-8')
    if (!decoded.includes('prod-sph.seeticketsusa.us')) return url
    const fixed = decoded.replace('prod-sph.seeticketsusa.us', 'prod-sih.seeticketsusa.us')
    return match[1] + Buffer.from(fixed, 'utf-8').toString('base64')
  } catch {
    return url
  }
}

function toISO(dateStr: string): string {
  const parts = dateStr.trim().split(/\s+/)
  if (parts.length < 3) return ''
  const month = MONTH_MAP[parts[1]] ?? -1
  const day = parseInt(parts[2], 10)
  if (month === -1 || isNaN(day)) return ''
  const now = new Date()
  const year =
    month < now.getMonth() || (month === now.getMonth() && day < now.getDate())
      ? now.getFullYear() + 1
      : now.getFullYear()
  return new Date(Date.UTC(year, month, day)).toISOString()
}

export async function scrape(): Promise<string> {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()
  await page.goto(venue.url, { waitUntil: 'networkidle' })

  async function collectCards() {
    return page.$$eval('.seetickets-list-event-container', (cards) =>
      cards.map((card) => {
        const info = card.querySelector('.event-info-block')
        const titleEl = info?.querySelector('p.title a')
        const href = titleEl?.getAttribute('href') ?? ''
        const slug = href.split('/event/')[1]?.split('/')[0] ?? ''
        const rawImage = card.querySelector('img')?.getAttribute('src') ?? ''
        return {
          title: titleEl?.textContent?.trim() ?? '',
          slug,
          dateText: info?.querySelector('p.date')?.textContent?.trim() ?? '',
          time: info?.querySelector('.see-showtime')?.textContent?.trim() ?? '',
          price: info?.querySelector('span.price')?.textContent?.trim() ?? '',
          genre: info?.querySelector('p.genre')?.textContent?.trim() ?? '',
          ticketUrl: href,
          image: rawImage,
        }
      })
    )
  }

  const pageNumbers = await page.$$eval(
    '.seetickets-list-view-pagination li[data-see-ajax-page]',
    (lis) => lis.map((li) => parseInt(li.getAttribute('data-see-ajax-page') ?? '0', 10)).filter((n) => n > 0)
  )
  const allPages = [1, ...pageNumbers.filter((n) => n !== 1)].sort((a, b) => a - b)
  console.log(`TV Eye: ${allPages.length} pages (${allPages.join(', ')})`)

  const bySlug = new Map<string, Awaited<ReturnType<typeof collectCards>>[number]>()
  for (const n of allPages) {
    if (n > 1) {
      const firstSlug = (await collectCards())[0]?.slug ?? ''
      await page.locator(`.seetickets-list-view-pagination li[data-see-ajax-page="${n}"]`).click()
      await page.waitForFunction(
        (prev) => {
          const first = document.querySelector('.seetickets-list-event-container .event-info-block p.title a')
          const href = first?.getAttribute('href') ?? ''
          const slug = href.split('/event/')[1]?.split('/')[0] ?? ''
          return slug && slug !== prev
        },
        firstSlug,
        { timeout: 15000 }
      )
    }
    const cards = await collectCards()
    for (const c of cards) if (c.slug) bySlug.set(c.slug, c)
    console.log(`  page ${n}: +${cards.length} cards (total unique: ${bySlug.size})`)
  }

  const rawCards = Array.from(bySlug.values()).map((c) => ({ ...c, image: fixSeeTicketsImage(c.image) }))

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() + 3)

  const filtered = rawCards
    .map((c) => ({ ...c, date: toISO(c.dateText) }))
    .filter((c) => c.date && new Date(c.date) <= cutoff)

  const limit = process.env.SCRAPE_LIMIT ? parseInt(process.env.SCRAPE_LIMIT) : Infinity
  const toProcess = filtered.slice(0, limit)

  await context.close()
  await browser.close()

  return toProcess
    .map((c) =>
      `TITLE: ${c.title}\nSLUG: ${c.slug}\nDATE: ${c.date}\nTIME: ${c.time}\nPRICE: ${c.price}\nGENRE: ${c.genre}\nIMAGE: ${c.image}\nTICKET_URL: ${c.ticketUrl}\nDETAILS:`
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
