import type { Metadata } from 'next'
import ShowGrid from '@/components/shows/show-grid'
import GenSearch from '@/components/shows/gen-search'
import { searchShows } from '@/lib/shows'

export const metadata: Metadata = {
  title: 'Search Shows',
  description: 'Search for shows in NYC',
  alternates: { canonical: '/search' },
  // Query-parameter search pages aren't useful in the index; keep Google
  // focused on the structured /shows/* and /venues/* pages instead.
  robots: { index: false, follow: true },
}

type Props = {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q ?? ''
  const shows = query ? await searchShows(query) : []

  return (
    <>
      <GenSearch />
      <ShowGrid items={shows} />
    </>
  )
}
