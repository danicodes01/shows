import type { ScrapedShow, VenueConfig } from './types'

const INGEST_URL = process.env.INGEST_URL ?? 'https://distortnewyork.com/api/shows'
const INGEST_SECRET = process.env.INGEST_SECRET!

export async function ingestShow(show: ScrapedShow, venue: VenueConfig): Promise<void> {
  if (!show.image?.trim()) {
    console.log(`  — Skipping "${show.title}" (no image)`)
    return
  }

  const res = await fetch(INGEST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INGEST_SECRET}`,
    },
    body: JSON.stringify({
      ...show,
      venueName: venue.name,
      venueSlug: venue.slug,
    }),
  })

  if (!res.ok) {
    console.error(`  ✗ Failed to ingest "${show.title}": ${res.status}`)
  } else {
    console.log(`  ✓ "${show.title}"`)
  }
}
