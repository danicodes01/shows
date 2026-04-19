import { type NextRequest, NextResponse } from 'next/server'
import { upsertVenue } from '@/lib/shows'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.INGEST_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, slug, date, genre, venueName, venueSlug, time, price, image, excerpt, rating, isFeatured, ticketUrl } = body

    if (!title?.trim() || !slug?.trim() || !date || !venueName?.trim() || !venueSlug?.trim() || !image?.trim()) {
      return NextResponse.json({ message: 'Invalid show data' }, { status: 422 })
    }

    const venue = await upsertVenue(venueName, venueSlug)

    await prisma.show.upsert({
      where: { slug },
      update: { title, date: new Date(date), genre, venueId: venue.id, time, price, image, excerpt: excerpt ?? '', ticketUrl: ticketUrl ?? '', rating: rating ?? 0, isFeatured: isFeatured ?? false },
      create: { title, slug, date: new Date(date), genre, venueId: venue.id, time, price, image, excerpt: excerpt ?? '', ticketUrl: ticketUrl ?? '', rating: rating ?? 0, isFeatured: isFeatured ?? false },
    })

    return NextResponse.json({ message: 'Show upserted' }, { status: 201 })
  } catch (err) {
    console.error('[api/shows] error:', err)
    return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
  }
}
