import type { Metadata } from 'next'
import { Suspense } from 'react'
import ShowGrid from '@/components/shows/show-grid'
import GenSearch from '@/components/shows/gen-search'
import Pagination from '@/components/shows/pagination'
import { getAllShows, searchShows, SHOWS_PER_PAGE } from '@/lib/shows'

export const metadata: Metadata = {
  title: 'All Shows',
  description: 'Find all shows in NYC and its boroughs',
}

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function ShowsPage({ searchParams }: Props) {
  const { q, page } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? '1', 10) || 1)

  if (q) {
    const shows = await searchShows(q)
    return (
      <>
        <Suspense fallback={null}>
          <GenSearch />
        </Suspense>
        <ShowGrid items={shows} />
      </>
    )
  }

  const { items, total } = await getAllShows({ page: currentPage })
  const totalPages = Math.max(1, Math.ceil(total / SHOWS_PER_PAGE))

  return (
    <>
      <Suspense fallback={null}>
        <GenSearch />
      </Suspense>
      <ShowGrid items={items} />
      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/shows" />
    </>
  )
}
