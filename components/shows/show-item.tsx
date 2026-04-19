import Link from 'next/link'
import type { ShowWithVenue } from '@/lib/shows'
import DateIcon from '@/components/ui/date-icon'
import AddressIcon from '@/components/ui/address-icon'
import classes from './show-item.module.css'

function isKnownGenre(genre: string | null | undefined): boolean {
  if (!genre) return false
  const g = genre.trim().toLowerCase()
  return g.length > 0 && g !== '<unknown>' && g !== 'unknown' && g !== 'n/a'
}

export default function ShowItem({ show }: { show: ShowWithVenue }) {
  const readableDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(show.date))

  return (
    <li className={classes.post}>
      <Link href={`/shows/${show.slug}`}>
        <div className={classes.image}>
          <img src={show.image} alt={show.title} />
        </div>
        <div className={classes.content}>
          <h3>{show.title}</h3>
          <div className={classes.date}>
            <DateIcon />
            <time>{readableDate}</time>
          </div>
          <div className={classes.address}>
            <AddressIcon />
            <address>{show.venue.name}</address>
          </div>
          {isKnownGenre(show.genre) && <p>{show.genre}</p>}
        </div>
      </Link>
    </li>
  )
}
