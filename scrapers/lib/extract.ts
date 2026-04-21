import Anthropic from '@anthropic-ai/sdk'
import type { ScrapedShow } from './types'

type ParsedEvent = {
  image: string
  ticketUrl: string
  previewUrl: string
  previewTrack: string
  venueName: string
}

export function parseRawEvents(rawText: string): Map<string, ParsedEvent> {
  const map = new Map<string, ParsedEvent>()
  for (const e of rawText.split('\n\n---\n\n').filter(Boolean)) {
    const slug = e.match(/^SLUG: (.+)$/m)?.[1]?.trim() ?? ''
    const image = e.match(/^IMAGE: (.+)$/m)?.[1]?.trim() ?? ''
    const ticketUrl = e.match(/^TICKET_URL: (.+)$/m)?.[1]?.trim() ?? ''
    const previewUrl = e.match(/^PREVIEW_URL: (.+)$/m)?.[1]?.trim() ?? ''
    const previewTrack = e.match(/^PREVIEW_TRACK: (.+)$/m)?.[1]?.trim() ?? ''
    const venueName = e.match(/^VENUE_NAME: (.+)$/m)?.[1]?.trim() ?? ''
    if (slug) map.set(slug, { image, ticketUrl, previewUrl, previewTrack, venueName })
  }
  return map
}

const client = new Anthropic()

const BATCH_SIZE = 10

const EXTRACT_TOOL: Anthropic.Tool = {
  name: 'ingest_shows',
  description: 'Output structured show data extracted from the venue listing',
  input_schema: {
    type: 'object' as const,
    properties: {
      shows: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title:  { type: 'string' },
            slug:   { type: 'string' },
            date:   { type: 'string', description: 'ISO 8601, e.g. "2026-05-10T00:00:00.000Z"' },
            time:   { type: 'string', description: 'e.g. "7:00 PM"' },
            price:  { type: 'string', description: 'Use advance price if multiple listed. Always prefix numeric amounts with "$" (e.g. "$15.00"). Use "Free" if $0. Do not output a bare number.' },
            genre:  { type: 'string', description: 'Infer from DETAILS if not provided, e.g. "punk", "experimental". Return an empty string if genre cannot be reasonably inferred. Never output placeholder text like "unknown" or "<UNKNOWN>".' },
            excerpt:   { type: 'string', description: 'Full description from DETAILS, preserving paragraph breaks as \\n\\n. If DETAILS is empty or missing, synthesize ONE short sentence from the other fields (title, genre, time, venue), e.g. "{title} — {genre} at {venue}, doors {time}".' },
          },
          required: ['title', 'slug', 'date', 'time', 'price', 'genre', 'excerpt'],
        },
      },
    },
    required: ['shows'],
  },
}

async function extractBatch(eventsText: string, venueName: string): Promise<{ shows: ScrapedShow[]; stopReason: string | null }> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: 'tool', name: 'ingest_shows' },
    messages: [
      {
        role: 'user',
        content: `Extract all shows from this venue listing. Each event is separated by "---".

Venue: ${venueName}

Event data:
${eventsText}`,
      },
    ],
  })

  const toolUse = message.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') return { shows: [], stopReason: message.stop_reason ?? null }
  const input = toolUse.input as { shows: ScrapedShow[] }
  return { shows: input.shows ?? [], stopReason: message.stop_reason ?? null }
}

export async function extractShows(rawText: string, venueName: string): Promise<ScrapedShow[]> {
  const events = rawText.split('\n\n---\n\n').filter(Boolean)
  const results: ScrapedShow[] = []

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batchNum = i / BATCH_SIZE + 1
    const batchEvents = events.slice(i, i + BATCH_SIZE)
    const batch = batchEvents.join('\n\n---\n\n')
    try {
      const { shows, stopReason } = await extractBatch(batch, venueName)
      console.log(`  batch ${batchNum}: ${shows.length}/${batchEvents.length} shows (stop: ${stopReason})`)
      if (stopReason === 'max_tokens') {
        console.warn(`    ⚠ hit max_tokens — lower BATCH_SIZE or raise max_tokens`)
      }
      results.push(...shows)
    } catch (err) {
      console.error(`  ✗ Batch ${batchNum} failed:`, err)
    }
  }

  return results
}
