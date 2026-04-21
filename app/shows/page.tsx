import type { Metadata } from 'next'
import { Suspense } from 'react'
import ShowGrid from '@/components/shows/show-grid'
import GenSearch from '@/components/shows/gen-search'
import VenueFilter from '@/components/shows/venue-filter'
import Pagination from '@/components/shows/pagination'
import {
  getAllShows,
  getUpcomingVenueCounts,
  searchShows,
  SHOWS_PER_PAGE,
} from '@/lib/shows'

export const metadata: Metadata = {
  title: 'All Shows',
  description: 'Find all shows in NYC and its boroughs',
  alternates: { canonical: '/shows' },
}

type Props = {
  searchParams: Promise<{ q?: string; page?: string; venue?: string }>
}

export default async function ShowsPage({ searchParams }: Props) {
  const { q, page, venue } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? '1', 10) || 1)

  const venueCounts = await getUpcomingVenueCounts()
  const totalUpcoming = venueCounts.reduce((sum, v) => sum + v.count, 0)
  const activeVenue = venueCounts.some((v) => v.slug === venue) ? (venue ?? '') : ''
  const venueOptions = venueCounts.map((v) => ({
    value: v.slug,
    label: v.name,
    count: v.count,
  }))

  const filters = (
    <>
      <Suspense fallback={null}>
        <GenSearch />
      </Suspense>
      <Suspense fallback={null}>
        <VenueFilter options={venueOptions} active={activeVenue} totalCount={totalUpcoming} />
      </Suspense>
    </>
  )

  if (q) {
    const shows = await searchShows(q, activeVenue || undefined)
    return (
      <>
        {filters}
        <ShowGrid items={shows} />
      </>
    )
  }

  const { items, total } = await getAllShows({
    page: currentPage,
    venueSlug: activeVenue || undefined,
  })
  const totalPages = Math.max(1, Math.ceil(total / SHOWS_PER_PAGE))
  const basePath = activeVenue ? `/shows?venue=${activeVenue}` : '/shows'

  return (
    <>
      {filters}
      <ShowGrid items={items} />
      <Pagination currentPage={currentPage} totalPages={totalPages} basePath={basePath} />
    </>
  )
}
