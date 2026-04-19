import type { Metadata } from 'next'
import classes from './layout.module.css'

export const metadata: Metadata = {
  title: 'Admin — DistortNewYork',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={classes.admin}>{children}</div>
}
