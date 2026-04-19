'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import classes from './category-filter.module.css'

type Option = { value: string; label: string; count: number }

interface CategoryFilterProps {
  options: Option[]
  active: string
  totalCount: number
}

export default function CategoryFilter({ options, active, totalCount }: CategoryFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const setCategory = (value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    if (value) next.set('cat', value)
    else next.delete('cat')
    const qs = next.toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname)
    })
  }

  return (
    <div className={classes.row} role="tablist" aria-label="Filter resources">
      <button
        type="button"
        role="tab"
        aria-selected={active === ''}
        className={active === '' ? classes.pillActive : classes.pill}
        onClick={() => setCategory('')}
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
          onClick={() => setCategory(opt.value)}
        >
          {opt.label} <span className={classes.count}>{opt.count}</span>
        </button>
      ))}
    </div>
  )
}
