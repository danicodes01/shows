import Anthropic from '@anthropic-ai/sdk'
import type { ScrapedShow } from './types'

const client = new Anthropic()

const BATCH_SIZE = 20

async function extractBatch(eventsText: string, venueName: string): Promise<ScrapedShow[]> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `Extract all shows from this venue listing. Each event is separated by "---". Return a JSON array only — no explanation, no markdown.

Venue: ${venueName}

Each show object must have these exact fields:
- title: string — band/show name
- slug: string — use the SLUG value provided exactly as-is
- date: string — ISO 8601 from the DATE field, e.g. "2026-05-10T00:00:00.000Z"
- time: string — from the TIME field, e.g. "7:00 PM"
- price: string — extract from DETAILS, e.g. "$15" or "Free". Use the advance price if multiple are listed.
- genre: string — infer from band description in DETAILS, e.g. "punk", "rock", "experimental". Use your best judgment.
- excerpt: string — 1-2 sentence description from DETAILS if available, otherwise ""
- image: string — from the IMAGE field, use as-is

Event data:
${eventsText}`,
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
  const text = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(text) as ScrapedShow[]
}

export async function extractShows(rawText: string, venueName: string): Promise<ScrapedShow[]> {
  const events = rawText.split('\n\n---\n\n').filter(Boolean)
  const results: ScrapedShow[] = []

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE).join('\n\n---\n\n')
    try {
      const shows = await extractBatch(batch, venueName)
      results.push(...shows)
    } catch (err) {
      console.error(`  ✗ Batch ${i / BATCH_SIZE + 1} failed:`, err)
    }
  }

  return results
}
