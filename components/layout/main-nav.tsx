'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import classes from './main-nav.module.css'
import logoClasses from './logo.module.css'

export default function MainNav() {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) return null

  return (
    <header className={classes.header}>
      <Link href="/" aria-label="Distort New York — home">
        <span className={logoClasses.logo} role="img" aria-label="Distort New York" />
      </Link>
      <nav>
        <ul>
          <li>
            <Link href="/shows" className={pathname === '/shows' ? classes.active : ''}>Shows</Link>
          </li>
          <li>
            <Link href="/contact" className={pathname === '/contact' ? classes.active : ''}>info/submit</Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
