import type { Metadata } from 'next'
import { Suspense } from 'react'
import ShowGrid from '@/components/shows/show-grid'
import GenSearch from '@/components/shows/gen-search'
import { getAllShows, searchShows } from '@/lib/shows'

export const metadata: Metadata = {
  title: 'All Shows',
  description: 'Find all shows in NYC and its boroughs',
}

type Props = {
  searchParams: Promise<{ q?: string }>
}

export default async function ShowsPage({ searchParams }: Props) {
  const { q } = await searchParams
  const shows = q ? await searchShows(q) : await getAllShows()

  return (
    <>
      <Suspense fallback={null}>
        <GenSearch />
      </Suspense>
      <ShowGrid items={shows} />
    </>
  )
}
