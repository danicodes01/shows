import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ShowContent from '@/components/shows/show-detail/show-content'
import Comments from '@/components/input/comments'
import { getShowBySlug, type ShowWithVenue } from '@/lib/shows'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const show = await getShowBySlug(slug)
  if (!show) return { title: 'Show Not Found' }

  const pageTitle = `${show.title} at ${show.venue.name}`
  const description =
    show.excerpt?.trim() ||
    `${show.title} at ${show.venue.name} — tickets, date, and details on DistortNewYork.`

  return {
    title: pageTitle,
    description,
    alternates: { canonical: `/shows/${show.slug}` },
    openGraph: {
      title: pageTitle,
      description,
      url: `/shows/${show.slug}`,
      type: 'article',
      images: show.image ? [{ url: show.image, alt: show.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: show.image ? [show.image] : undefined,
    },
  }
}

function buildEventSchema(show: ShowWithVenue) {
  const numericPrice = show.price?.replace(/[^0-9.]/g, '') ?? ''
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: show.title,
    startDate: new Date(show.date).toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: show.venue.name,
      ...(show.venue.address
        ? { address: show.venue.address }
        : { address: { '@type': 'PostalAddress', addressLocality: 'New York', addressRegion: 'NY', addressCountry: 'US' } }),
    },
    ...(show.image ? { image: [show.image] } : {}),
    ...(show.excerpt ? { description: show.excerpt } : {}),
    ...(show.ticketUrl
      ? {
          offers: {
            '@type': 'Offer',
            url: show.ticketUrl,
            availability: 'https://schema.org/InStock',
            ...(numericPrice ? { price: numericPrice, priceCurrency: 'USD' } : {}),
          },
        }
      : {}),
    performer: { '@type': 'MusicGroup', name: show.title },
    organizer: { '@type': 'Organization', name: show.venue.name },
  }
}

export default async function ShowDetailPage({ params }: Props) {
  const { slug } = await params
  const show = await getShowBySlug(slug)
  if (!show) notFound()

  const eventSchema = buildEventSchema(show)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventSchema).replace(/</g, '\\u003c'),
        }}
      />
      <ShowContent show={show} />
      <Comments showId={show.id} />
    </>
  )
}
