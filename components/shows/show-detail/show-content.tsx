import type { ShowWithVenue } from '@/lib/shows'
import { displayValue } from '@/lib/display'
import PreviewPlayer from './preview-player'
import classes from './show-content.module.css'

export default function ShowContent({ show }: { show: ShowWithVenue }) {
  const readableDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
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
      <div className={classes.body}>
        <div className={classes.image}>
          <img src={show.image} alt={show.title} />
        </div>
        <div className={classes.details}>
          <p className={classes.venue}>{show.venue.name}</p>
          <time>{readableDate}</time>
          <p>{displayValue(show.time)}</p>
          <p>{displayValue(show.price)}</p>
          {show.excerpt && <p className={classes.excerpt}>{show.excerpt}</p>}
          {show.previewUrl && (
            <PreviewPlayer src={show.previewUrl} trackTitle={show.previewTrack} />
          )}
          {show.ticketUrl && (
            <a
              href={show.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.ticketLink}
            >
              Buy Tickets
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
