import Link from 'next/link'
import { logoutAction } from '@/actions/admin/auth'
import prisma from '@/lib/prisma'
import classes from './dashboard.module.css'

export default async function AdminDashboardPage() {
  const submissionCount = await prisma.contact.count()

  return (
    <section className={classes.wrap}>
      <h1 className={classes.title}>You&apos;re in</h1>
      <nav className={classes.nav}>
        <Link href="/admin/shows" className={classes.navLink}>Manage shows</Link>
        <Link href="/admin/shows/new" className={classes.navLink}>Build show</Link>
        <Link href="/admin/submissions" className={classes.navLink}>
          Submissions
          {submissionCount > 0 && <span className={classes.badge}>{submissionCount}</span>}
        </Link>
        <Link href="/admin/resources" className={classes.navLink}>Resources</Link>
        <Link href="/admin/newsletter" className={classes.navLink}>Newsletter</Link>
      </nav>
      <form action={logoutAction}>
        <button type="submit" className={classes.signOut}>Sign out</button>
      </form>
    </section>
  )
}
