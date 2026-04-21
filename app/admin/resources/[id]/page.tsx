import Link from 'next/link'
import { notFound } from 'next/navigation'
import ResourceForm from '@/components/admin/resource-form'
import { getAllResourceCategories, getResourceById } from '@/lib/resources'
import classes from '../../shows/shows.module.css'

export const metadata = {
  title: 'Admin — Edit resource',
  robots: { index: false, follow: false },
}

type Props = { params: Promise<{ id: string }> }

export default async function EditResourcePage({ params }: Props) {
  const { id } = await params
  const [resource, categories] = await Promise.all([
    getResourceById(id),
    getAllResourceCategories(),
  ])
  if (!resource) notFound()

  const defaults = {
    id: resource.id,
    name: resource.name,
    description: resource.description,
    url: resource.url,
    cta: resource.cta,
    sortOrder: resource.sortOrder,
    categoryId: resource.categoryId,
  }

  return (
    <section>
      <div className={classes.header}>
        <h1 className={classes.title}>Edit resource</h1>
        <Link href="/admin/resources" className={classes.backLink}>← Back to resources</Link>
      </div>
      <ResourceForm mode="edit" categories={categories} defaults={defaults} />
    </section>
  )
}
