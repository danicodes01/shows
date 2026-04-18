import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ShowGrid from '@/components/shows/show-grid'
import { getVenueBySlug } from '@/lib/shows'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const venue = await getVenueBySlug(slug)
  if (!venue) return { title: 'Venue Not Found' }
  return {
    title: `${venue.name} — Shows`,
    description: `Upcoming shows at ${venue.name}`,
  }
}

export default async function VenuePage({ params }: Props) {
  const { slug } = await params
  const venue = await getVenueBySlug(slug)
  if (!venue) notFound()

  return (
    <>
      <h1>{venue.name}</h1>
      {venue.address && <p>{venue.address}</p>}
      {venue.neighborhood && <p>{venue.neighborhood}</p>}
      {venue.website && <a href={venue.website} target="_blank" rel="noopener noreferrer">{venue.website}</a>}
      <ShowGrid items={venue.shows} />
    </>
  )
}
