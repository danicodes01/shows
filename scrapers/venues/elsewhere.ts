import '../lib/env'
import { chromium } from 'playwright'
import { extractShows, parseRawEvents } from '../lib/extract'
import { ingestShow } from '../lib/ingest'
import type { VenueConfig } from '../lib/types'

export const venue: VenueConfig = {
  name: 'Elsewhere',
  slug: 'elsewhere',
  url: 'https://www.ohmyrockness.com/venues/elsewhere',
}

// OMR wraps the real ticket URL in a consumer.pxf.io affiliate redirect via ?u=
// Decode it so we navigate straight to Eventbrite — faster and avoids the hop.
function decodeTicketUrl(href: string): string {
  try {
    const u = new URL(href)
    return u.searchParams.get('u') ?? href
  } catch {
    return href
  }
}

export async function scrape(): Promise<string> {
  const browser = await chromium.launch()
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

  console.log(`Elsewhere (OMR): ${rawCards.length} rows on list page`)

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
      const { image, description } = await detailPage.evaluate(() => {
        // Eventbrite hero: prefer the widest srcset entry, then unwrap the
        // Next.js image proxy to get the underlying img.evbuc.com URL.
        const hero = document.querySelector('[data-testid="hero-img"]') as HTMLImageElement | null
        const srcset = hero?.getAttribute('srcset') ?? ''
        const src = hero?.getAttribute('src') ?? ''
        const candidates = srcset
          ? srcset.split(/,\s+/).map((s) => {
              const parts = s.trim().split(/\s+/)
              const w = parseInt((parts[parts.length - 1] ?? '').replace('w', ''), 10)
              return { url: parts.slice(0, -1).join(' '), width: isNaN(w) ? 0 : w }
            })
          : []
        candidates.sort((a, b) => b.width - a.width)
        const largest = candidates[0]?.url || src
        let image = largest
        const proxyMatch = largest.match(/\/_next\/image\?url=([^&]+)/)
        if (proxyMatch) {
          try {
            image = decodeURIComponent(proxyMatch[1])
          } catch {}
        } else if (largest.startsWith('/')) {
          image = 'https://www.eventbrite.com' + largest
        }

        // Full description lives in the hidden AboutThisEventEmbedded container
        // as structured text-content blocks. Fall back to the visible summary.
        const aboutContainer = document.querySelector('[class*="AboutThisEventEmbedded_container"]')
        const blocks = aboutContainer
          ? Array.from(aboutContainer.querySelectorAll('[data-testid="text-content"]'))
          : []
        let description = blocks
          .map((b) => {
            const paragraphs = Array.from(b.querySelectorAll('p'))
              .map((p) => p.textContent?.trim() ?? '')
              .filter(Boolean)
            return paragraphs.length ? paragraphs.join('\n\n') : b.textContent?.trim() ?? ''
          })
          .filter(Boolean)
          .join('\n\n')
        if (!description) {
          const wrapper = document.querySelector(
            '[class*="Overview_summaryWrapper"]',
          ) as HTMLElement | null
          description = wrapper?.innerText?.trim() ?? ''
        }

        return { image, description }
      })

      events.push(
        `TITLE: ${card.title}\nSLUG: ${card.slug}\nDATE: ${card.iso}\nTIME: ${card.time}\nPRICE: \nGENRE: \nIMAGE: ${image}\nTICKET_URL: ${card.ticketUrl}\nDETAILS:\n${description}`,
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
    }
    await ingestShow(show, venue)
  }
  console.log(`✓ ${shows.length} shows ingested`)
}

if (require.main === module) {
  run().catch(console.error)
}
