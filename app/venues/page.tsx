import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllVenues } from '@/lib/shows'

export const metadata: Metadata = {
  title: 'Venues',
  description: 'NYC venues featuring underground shows',
  alternates: { canonical: '/venues' },
}

export default async function VenuesPage() {
  const venues = await getAllVenues()

  return (
    <div>
      <h1>Venues</h1>
      <ul>
        {venues.map(venue => (
          <li key={venue.id}>
            <Link href={`/venues/${venue.slug}`}>{venue.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
