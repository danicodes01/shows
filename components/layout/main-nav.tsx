'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import classes from './main-nav.module.css'
import logoClasses from './logo.module.css'

export default function MainNav() {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) return null

  return (
    <header className={classes.header}>
      <Link href="/" aria-label="Distort New York — home">
        <Image
          src="/images/logo.PNG"
          alt="Distort New York"
          width={90}
          height={90}
          className={logoClasses.image}
        />
        <span className={logoClasses.mask} aria-hidden="true" />
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
