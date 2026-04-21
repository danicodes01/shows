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

  const title = `${venue.name} — Upcoming Shows`
  const description = `Upcoming shows at ${venue.name} in NYC. Dates, lineups, tickets, and details on DistortNewYork.`

  return {
    title,
    description,
    alternates: { canonical: `/venues/${venue.slug}` },
    openGraph: {
      title,
      description,
      url: `/venues/${venue.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function VenuePage({ params }: Props) {
  const { slug } = await params
  const venue = await getVenueBySlug(slug)
  if (!venue) notFound()

  const venueSchema = {
    '@context': 'https://schema.org',
    '@type': 'MusicVenue',
    name: venue.name,
    url: `https://distortnewyork.com/venues/${venue.slug}`,
    ...(venue.address
      ? { address: venue.address }
      : { address: { '@type': 'PostalAddress', addressLocality: 'New York', addressRegion: 'NY', addressCountry: 'US' } }),
    ...(venue.website ? { sameAs: venue.website } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(venueSchema).replace(/</g, '\\u003c'),
        }}
      />
      <h1>{venue.name}</h1>
      {venue.address && <p>{venue.address}</p>}
      {venue.neighborhood && <p>{venue.neighborhood}</p>}
      {venue.website && <a href={venue.website} target="_blank" rel="noopener noreferrer">{venue.website}</a>}
      <ShowGrid items={venue.shows} />
    </>
  )
}
