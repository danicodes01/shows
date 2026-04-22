import type { Metadata } from 'next'
import { getAllSubscribers, getRecentSends } from '@/lib/newsletter'
import { getUpcomingShowsForPicker } from '@/lib/shows'
import NewsletterClient from '@/components/admin/newsletter/newsletter-client'
import classes from '../shows/shows.module.css'

export const metadata: Metadata = {
  title: 'Admin — Newsletter',
  robots: { index: false, follow: false },
}

export default async function AdminNewsletterPage() {
  const [subscribers, recentSends, shows] = await Promise.all([
    getAllSubscribers(),
    getRecentSends(10),
    getUpcomingShowsForPicker(),
  ])

  return (
    <section className={classes.page}>
      <header className={classes.header}>
        <h1 className={classes.title}>Newsletter</h1>
        <p className={classes.count}>
          {subscribers.length.toLocaleString()} subscriber{subscribers.length === 1 ? '' : 's'}
        </p>
      </header>
      <NewsletterClient
        subscribers={subscribers.map((s) => ({
          id: s.id,
          email: s.email,
          createdAt: s.createdAt.toISOString(),
        }))}
        shows={shows}
        recentSends={recentSends.map((s) => ({
          id: s.id,
          subject: s.subject,
          recipientCount: s.recipientCount,
          sentAt: s.sentAt.toISOString(),
        }))}
      />
    </section>
  )
}
