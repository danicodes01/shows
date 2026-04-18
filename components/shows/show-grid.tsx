import type { ShowWithVenue } from '@/lib/shows'
import ShowItem from './show-item'
import classes from './show-grid.module.css'

export default function ShowGrid({ items }: { items: ShowWithVenue[] }) {
  return (
    <ul className={classes.grid}>
      {items.map(item => (
        <ShowItem key={item.id} show={item} />
      ))}
    </ul>
  )
}
