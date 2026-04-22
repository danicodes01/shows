import Link from 'next/link'
import { isAuthenticated } from '@/lib/admin/session'
import classes from './admin-nav.module.css'

export default async function AdminNav() {
  // Don't show the admin nav on the login page (or anywhere the user isn't
  // authenticated yet) — there's nothing for them to navigate to.
  const authed = await isAuthenticated()
  if (!authed) return null

  return (
    <nav className={classes.nav} aria-label="Admin navigation">
      <Link href="/admin" className={classes.home}>← Admin home</Link>
      <div className={classes.links}>
        <Link href="/admin/shows" className={classes.link}>Shows</Link>
        <Link href="/admin/submissions" className={classes.link}>Submissions</Link>
        <Link href="/admin/resources" className={classes.link}>Resources</Link>
        <Link href="/admin/newsletter" className={classes.link}>Newsletter</Link>
      </div>
    </nav>
  )
}
