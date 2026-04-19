import type { Metadata } from 'next'
import FeaturedShows from '@/components/home-page/featured-shows'
import Starfleet from '@/components/home-page/starfleet'
import Newsletter from '@/components/input/newsletter'
import { getFeaturedShows } from '@/lib/shows'

export const metadata: Metadata = {
  title: 'Featured Shows in NY',
  description: 'Our top picks for shows to see in NY',
}

export const revalidate = 60

export default async function HomePage() {
  const shows = await getFeaturedShows()
  return (
    <>
      <Starfleet />
      <Newsletter />
      <FeaturedShows shows={shows} />
    </>
  )
}
