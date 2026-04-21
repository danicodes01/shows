import Link from 'next/link'
import { toggleFeaturedAction } from '@/actions/admin/shows'
import type { ShowWithVenue } from '@/lib/shows'
import classes from './show-table.module.css'

type Props = { items: ShowWithVenue[] }

const dateFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: 'short',
  day: '2-digit',
})

export default function ShowTable({ items }: Props) {
  if (items.length === 0) {
    return <p className={classes.empty}>No shows match these filters.</p>
  }
  return (
    <div className={classes.wrap}>
      <table className={classes.table}>
        <thead>
          <tr>
            <th aria-label="Image"></th>
            <th>Title</th>
            <th>Venue</th>
            <th>Date</th>
            <th>Genre</th>
            <th aria-label="Featured">★</th>
            <th>Rating</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(show => (
            <tr key={show.id}>
              <td className={classes.thumbCell}>
                {show.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={show.image} alt="" className={classes.thumb} loading="lazy" />
                ) : (
                  <div className={classes.thumbEmpty} aria-hidden="true">—</div>
                )}
              </td>
              <td className={classes.title}>
                <Link href={`/admin/shows/${show.id}`} className={classes.titleLink}>
                  {show.title}
                </Link>
              </td>
              <td className={classes.clamp}>{show.venue.name}</td>
              <td className={classes.num}>{dateFmt.format(show.date)}</td>
              <td className={classes.clamp}>{show.genre}</td>
              <td className={classes.center}>
                <form action={toggleFeaturedAction}>
                  <input type="hidden" name="id" value={show.id} />
                  <input type="hidden" name="next" value={String(!show.isFeatured)} />
                  <button
                    type="submit"
                    className={show.isFeatured ? classes.starOn : classes.starOff}
                    aria-label={show.isFeatured ? 'Unfeature' : 'Feature'}
                    title={show.isFeatured ? 'Unfeature' : 'Feature'}
                  >
                    {show.isFeatured ? '★' : '☆'}
                  </button>
                </form>
              </td>
              <td className={classes.num}>{show.rating}</td>
              <td>
                <Link href={`/admin/shows/${show.id}`} className={classes.action}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
