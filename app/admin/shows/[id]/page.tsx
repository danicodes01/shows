import Link from 'next/link'
import { notFound } from 'next/navigation'
import ShowForm from '@/components/admin/show-form'
import DeleteShowButton from '@/components/admin/delete-show-button'
import prisma from '@/lib/prisma'
import { getAllVenues } from '@/lib/shows'
import classes from '../shows.module.css'

export const metadata = {
  title: 'Edit show',
  robots: { index: false, follow: false },
}

type Props = { params: Promise<{ id: string }> }

export default async function EditShowPage({ params }: Props) {
  const { id } = await params
  const [show, venues] = await Promise.all([
    prisma.show.findUnique({ where: { id }, include: { venue: true } }),
    getAllVenues(),
  ])
  if (!show) notFound()

  return (
    <section>
      <div className={classes.header}>
        <h1 className={classes.title}>Edit show</h1>
        <Link href="/admin/shows" className={classes.backLink}>← Back to shows</Link>
      </div>
      <ShowForm mode="edit" venues={venues} defaults={show} />
      <div className={classes.deleteRow}>
        <DeleteShowButton id={show.id} title={show.title} />
      </div>
    </section>
  )
}
