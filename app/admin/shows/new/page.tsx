import Link from 'next/link'
import ShowForm from '@/components/admin/show-form'
import { getAllVenues } from '@/lib/shows'
import classes from '../shows.module.css'

export const metadata = {
  title: 'Build show',
  robots: { index: false, follow: false },
}

export default async function NewShowPage() {
  const venues = await getAllVenues()
  return (
    <section>
      <div className={classes.header}>
        <h1 className={classes.title}>Build show</h1>
        <Link href="/admin/shows" className={classes.backLink}>← Back to shows</Link>
      </div>
      <ShowForm mode="create" venues={venues} defaults={{}} />
    </section>
  )
}
