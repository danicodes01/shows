import { logoutAction } from '@/actions/admin/auth'
import classes from './dashboard.module.css'

export default function AdminDashboardPage() {
  return (
    <section className={classes.wrap}>
      <h1 className={classes.title}>You&apos;re in</h1>
      <p className={classes.hint}>Admin dashboard content comes next.</p>
      <form action={logoutAction}>
        <button type="submit" className={classes.signOut}>Sign out</button>
      </form>
    </section>
  )
}
