import type { Metadata } from 'next'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import SubmissionsTable, { type SubmissionsSort } from '@/components/admin/submissions-table'
import classes from '../shows/shows.module.css'

export const metadata: Metadata = {
  title: 'Admin — Submissions',
  robots: { index: false, follow: false },
}

type Props = { searchParams: Promise<{ sort?: string }> }

export default async function SubmissionsPage({ searchParams }: Props) {
  const { sort: rawSort } = await searchParams
  const sort: SubmissionsSort = rawSort === 'oldest' ? 'oldest' : 'newest'
  const submissions = await prisma.contact.findMany({
    orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
  })

  return (
    <section className={classes.page}>
      <header className={classes.header}>
        <h1 className={classes.title}>Submissions</h1>
        <div className={classes.headerActions}>
          <p className={classes.count}>
            {submissions.length.toLocaleString()} submission{submissions.length === 1 ? '' : 's'}
          </p>
          <Link href="/admin/shows" className={classes.backLink}>Shows →</Link>
        </div>
      </header>
      <SubmissionsTable items={submissions} sort={sort} />
    </section>
  )
}
