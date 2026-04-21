import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllResources } from '@/lib/resources'
import ResourcesTable from '@/components/admin/resources-table'
import classes from '../shows/shows.module.css'

export const metadata: Metadata = {
  title: 'Admin — Resources',
  robots: { index: false, follow: false },
}

export default async function AdminResourcesPage() {
  const resources = await getAllResources()

  return (
    <section className={classes.page}>
      <header className={classes.header}>
        <h1 className={classes.title}>Resources</h1>
        <div className={classes.headerActions}>
          <p className={classes.count}>
            {resources.length.toLocaleString()} resource{resources.length === 1 ? '' : 's'}
          </p>
          <Link href="/admin/resources/new" className={classes.buildLink}>+ Add resource</Link>
        </div>
      </header>
      <ResourcesTable items={resources} />
    </section>
  )
}
