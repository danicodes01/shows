import type { ShowWithVenue } from '@/lib/shows'
import classes from './show-content.module.css'

export default function ShowContent({ show }: { show: ShowWithVenue }) {
  const readableDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(show.date))

  return (
    <article className={classes.content}>
      <header className={classes.header}>
        <h1>{show.title}</h1>
      </header>
      <div className={classes.image}>
        <img src={show.image} alt={show.title} />
      </div>
      <div className={classes.details}>
        <p>{show.venue.name}</p>
        <p>{show.time}</p>
        <time>{readableDate}</time>
        <p>${show.price}</p>
        {show.excerpt && <p>{show.excerpt}</p>}
      </div>
    </article>
  )
}
