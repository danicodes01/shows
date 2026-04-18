<<<<<<< HEAD:components/shows/show-item.tsx
import Link from 'next/link'
import type { ShowWithVenue } from '@/lib/shows'
import DateIcon from '@/components/ui/date-icon'
import AddressIcon from '@/components/ui/address-icon'
import classes from './show-item.module.css'

export default function ShowItem({ show }: { show: ShowWithVenue }) {
=======
import Link from 'next/link';
import DateIcon from '../icons/date-icon';
import AddressIcon from '../icons/address-icon';
import classes from './show-item.module.css';

function ShowItem({ show }) {
  const { _id, title, date, location, genre, image } = show;

>>>>>>> upstream/main:components/shows/show-item.js
  const readableDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
<<<<<<< HEAD:components/shows/show-item.tsx
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
          <p>{show.genre}</p>
        </div>
=======
    timeZone: 'UTC'
  }).format(new Date(date));


  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'UTC'
  }).format(new Date(date));


  const formattedAddress = location.replace(',', '\n');
  const exploreLink = `/shows/${_id}`;

  return (
    <li className={classes.post}>
      <Link href={exploreLink} className={classes.link}>
          <div className={classes.image}>
            <img src={image} alt={title} />
          </div>
          <div className={classes.content}>
            <h3>{title}</h3>
            <div className={classes.date}>
              <DateIcon />
              <time>{dayOfWeek} {readableDate}</time>
            </div>
            <div className={classes.address}>
              <AddressIcon />
              <address>{formattedAddress}</address>
            </div>
            <div>
              <p>{genre}</p>
            </div>
          </div>
>>>>>>> upstream/main:components/shows/show-item.js
      </Link>
    </li>
  );
}
<<<<<<< HEAD:components/shows/show-item.tsx
=======

export default ShowItem;
>>>>>>> upstream/main:components/shows/show-item.js
