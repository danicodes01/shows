import Link from 'next/link'
import type { ShowWithVenue } from '@/lib/shows'
import ShowGrid from '@/components/shows/show-grid'
import classes from './featured-shows.module.css'

export default function FeaturedShows({ shows }: { shows: ShowWithVenue[] }) {
  return (
    <section className={classes.latest}>
      <h2 className="center">recommended events...</h2>
      <ShowGrid items={shows} />
      <div className={classes.cta}>
        <Link href="/shows" className={classes.seeAll}>
          See all shows
        </Link>
      </div>
    </section>
  )
}
