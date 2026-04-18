import type { Metadata } from 'next'
import ShowGrid from '@/components/shows/show-grid'
import GenSearch from '@/components/shows/gen-search'
import { searchShows } from '@/lib/shows'

export const metadata: Metadata = {
  title: 'Search Shows',
  description: 'Search for shows in NYC',
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
