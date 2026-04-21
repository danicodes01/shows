import Link from 'next/link'
import { notFound } from 'next/navigation'
import ShowForm from '@/components/admin/show-form'
import DeleteSubmissionButton from '@/components/admin/delete-submission-button'
import prisma from '@/lib/prisma'
import { getAllVenues } from '@/lib/shows'
import classes from '../../shows/shows.module.css'

export const metadata = {
  title: 'Review submission',
  robots: { index: false, follow: false },
}

type Props = { params: Promise<{ id: string }> }

function guessDate(input: string): string | null {
  if (!input) return null
  const d = new Date(input)
  if (!isNaN(d.getTime())) return d.toISOString()
  return null
}

export default async function SubmissionDetailPage({ params }: Props) {
  const { id } = await params
  const [submission, venues] = await Promise.all([
    prisma.contact.findUnique({ where: { id } }),
    getAllVenues(),
  ])
  if (!submission) notFound()

  const matchedVenue = submission.venue
    ? venues.find((v) => v.name.toLowerCase() === submission.venue.toLowerCase().trim())
    : undefined

  const defaults = {
    title: submission.title,
    date: guessDate(submission.date),
    genre: submission.genre,
    time: submission.time,
    price: submission.price,
    excerpt: submission.excerpt,
    image: submission.imageUrl,
    venueId: matchedVenue?.id ?? '',
  }

  return (
    <section>
      <div className={classes.header}>
        <h1 className={classes.title}>Review submission</h1>
        <Link href="/admin/submissions" className={classes.backLink}>← Back to submissions</Link>
      </div>
      <p className={classes.submitterNote}>
        Submitted by <strong>{submission.email || '(no email)'}</strong>
        {submission.venue && !matchedVenue && (
          <> — submitter venue <em>&ldquo;{submission.venue}&rdquo;</em> has no match in the DB; pick one below or add a new venue.</>
        )}
      </p>
      <ShowForm mode="submission" venues={venues} defaults={defaults} contactId={submission.id} />
      <div className={classes.deleteRow}>
        <DeleteSubmissionButton id={submission.id} title={submission.title || '(untitled)'} />
      </div>
    </section>
  )
}
