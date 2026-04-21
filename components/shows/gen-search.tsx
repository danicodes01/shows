'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef } from 'react'
import classes from './gen-search.module.css'

export default function GenSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString())
      if (value.trim()) next.set('q', value.trim())
      else next.delete('q')
      next.delete('page')
      const qs = next.toString()
      router.replace(qs ? `/shows?${qs}` : '/shows')
    }, 300)
  }

  // Keying by venue means the input remounts when the active venue changes
  // (picking up the cleared q from the URL) but stays mounted while typing.
  const venueKey = searchParams.get('venue') ?? ''

  return (
    <div className={classes.search}>
      <input
        key={venueKey}
        type="search"
        placeholder="Search shows, genres, venues..."
        defaultValue={searchParams.get('q') ?? ''}
        onChange={handleChange}
      />
    </div>
  )
}
