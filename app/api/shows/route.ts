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
    const { title, slug, date, genre, venueName, venueSlug, time, price, image, excerpt, rating, isFeatured, ticketUrl, previewUrl, previewTrack } = body

    if (!title?.trim() || !slug?.trim() || !date || !venueName?.trim() || !venueSlug?.trim() || !image?.trim()) {
      return NextResponse.json({ message: 'Invalid show data' }, { status: 422 })
    }

    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ message: `Invalid date: ${date}` }, { status: 422 })
    }

    const venue = await upsertVenue(venueName, venueSlug)

    const data = {
      title,
      date: parsedDate,
      genre: genre ?? '',
      venueId: venue.id,
      time: time ?? '',
      price: price ?? '',
      image,
      excerpt: excerpt ?? '',
      ticketUrl: ticketUrl ?? '',
      previewUrl: previewUrl ?? '',
      previewTrack: previewTrack ?? '',
      rating: rating ?? 0,
      isFeatured: isFeatured ?? false,
    }

    await prisma.show.upsert({
      where: { slug },
      update: data,
      create: { ...data, slug },
    })

    return NextResponse.json({ message: 'Show upserted' }, { status: 201 })
  } catch (err) {
    console.error('[api/shows] error:', err)
    return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
  }
}
