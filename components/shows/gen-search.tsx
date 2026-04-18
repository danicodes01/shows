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
      if (value.trim()) {
        router.replace(`/shows?q=${encodeURIComponent(value.trim())}`)
      } else {
        router.replace('/shows')
      }
    }, 300)
  }

  return (
    <div className={classes.search}>
      <input
        type="search"
        placeholder="Search shows, genres, venues..."
        defaultValue={searchParams.get('q') ?? ''}
        onChange={handleChange}
      />
    </div>
  )
}
