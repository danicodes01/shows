import Link from 'next/link'
import ResourceForm from '@/components/admin/resource-form'
import { getAllResourceCategories } from '@/lib/resources'
import classes from '../../shows/shows.module.css'

export const metadata = {
  title: 'Admin — Add resource',
  robots: { index: false, follow: false },
}

export default async function NewResourcePage() {
  const categories = await getAllResourceCategories()

  return (
    <section>
      <div className={classes.header}>
        <h1 className={classes.title}>Add a resource</h1>
        <Link href="/admin/resources" className={classes.backLink}>← Back to resources</Link>
      </div>
      <ResourceForm mode="create" categories={categories} />
    </section>
  )
}
