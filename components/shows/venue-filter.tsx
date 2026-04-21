'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import classes from './venue-filter.module.css'

type Option = { value: string; label: string; count: number }

interface VenueFilterProps {
  options: Option[]
  active: string
  totalCount: number
}

export default function VenueFilter({ options, active, totalCount }: VenueFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const rowRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuQuery, setMenuQuery] = useState('')

  useEffect(() => {
    // Don't yank the rail back to "All" when the user deselects — they're
    // mid-browse and expect their scroll position to stay put.
    if (!active) return
    const row = rowRef.current
    if (!row) return
    const el = row.querySelector<HTMLButtonElement>('[aria-selected="true"]')
    if (!el) return
    const elLeft = el.offsetLeft
    const elRight = elLeft + el.clientWidth
    const viewLeft = row.scrollLeft
    const viewRight = viewLeft + row.clientWidth
    // Only scroll if the active pill is actually off-screen (e.g. picked from
    // the dropdown menu); if it's already visible, leave scroll alone.
    if (elLeft < viewLeft || elRight > viewRight) {
      const left = elLeft - (row.clientWidth - el.clientWidth) / 2
      row.scrollTo({ left, behavior: 'smooth' })
    }
  }, [active])

  useEffect(() => {
    if (!menuOpen) {
      setMenuQuery('')
      return
    }
    // Focus the filter input as soon as the menu opens
    const raf = requestAnimationFrame(() => searchInputRef.current?.focus())
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const filteredOptions = menuQuery.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(menuQuery.trim().toLowerCase()))
    : options

  const setVenue = (value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    if (value) next.set('venue', value)
    else next.delete('venue')
    // Changing the venue clears the stale search query and resets pagination —
    // prevents the "searched but filtered to empty venue" confusion.
    next.delete('q')
    next.delete('page')
    const qs = next.toString()
    setMenuOpen(false)
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  return (
    <div className={classes.wrap} ref={wrapRef}>
      <button
        type="button"
        className={classes.menuToggle}
        onClick={() => setMenuOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        aria-label="Show all venues"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
        </svg>
      </button>

      <div className={classes.rail}>
        <div ref={rowRef} className={classes.row} role="tablist" aria-label="Filter by venue">
          <button
            type="button"
            role="tab"
            aria-selected={active === ''}
            className={active === '' ? classes.pillActive : classes.pill}
            onClick={() => setVenue('')}
          >
            All <span className={classes.count}>{totalCount}</span>
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active === opt.value}
              className={active === opt.value ? classes.pillActive : classes.pill}
              onClick={() => setVenue(active === opt.value ? '' : opt.value)}
            >
              {opt.label} <span className={classes.count}>{opt.count}</span>
            </button>
          ))}
        </div>
      </div>

      {menuOpen && (
        <div className={classes.menu} role="menu">
          <input
            ref={searchInputRef}
            type="search"
            value={menuQuery}
            onChange={(e) => setMenuQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const first = filteredOptions[0]
                if (first) setVenue(first.value)
                else if (!menuQuery.trim()) setVenue('')
              }
            }}
            placeholder="Filter venues"
            className={classes.menuSearch}
            aria-label="Filter venues"
          />
          <ul className={classes.menuList}>
            {!menuQuery.trim() && (
              <li>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setVenue('')}
                  className={active === '' ? classes.menuItemActive : classes.menuItem}
                >
                  <span>All</span>
                  <span className={classes.menuCount}>{totalCount}</span>
                </button>
              </li>
            )}
            {filteredOptions.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setVenue(active === opt.value ? '' : opt.value)}
                  className={active === opt.value ? classes.menuItemActive : classes.menuItem}
                >
                  <span>{opt.label}</span>
                  <span className={classes.menuCount}>{opt.count}</span>
                </button>
              </li>
            ))}
            {filteredOptions.length === 0 && menuQuery.trim() && (
              <li className={classes.menuEmpty}>No venues match</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
