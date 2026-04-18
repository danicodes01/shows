import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ShowContent from '@/components/shows/show-detail/show-content'
import Comments from '@/components/input/comments'
import { getShowBySlug } from '@/lib/shows'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const show = await getShowBySlug(slug)
  if (!show) return { title: 'Show Not Found' }
  return {
    title: show.title,
    description: show.excerpt,
  }
}

export default async function ShowDetailPage({ params }: Props) {
  const { slug } = await params
  const show = await getShowBySlug(slug)
  if (!show) notFound()

  return (
    <>
      <ShowContent show={show} />
      <Comments showId={show.id} />
    </>
  )
}
