'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { Venue } from '@/lib/shows'
import classes from './filter-panel.module.css'

type Props = { venues: Venue[] }

type TextKey = 'q' | 'date_from' | 'date_to'
const TEXT_KEYS: TextKey[] = ['q', 'date_from', 'date_to']

export default function FilterPanel({ venues }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const initialText = useMemo(() => {
    const obj = {} as Record<TextKey, string>
    for (const k of TEXT_KEYS) obj[k] = searchParams.get(k) ?? ''
    return obj
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [text, setText] = useState(initialText)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentVenueSlugs = useMemo(() => {
    const raw = searchParams.get('venue')
    return raw ? raw.split(',').filter(Boolean) : []
  }, [searchParams])

  const featured = searchParams.get('featured') ?? ''

  function push(next: URLSearchParams) {
    next.delete('page')
    const qs = next.toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname)
    })
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString())
    if (value == null || value === '') next.delete(key)
    else next.set(key, value)
    push(next)
  }

  function onTextChange(key: TextKey, value: string) {
    setText(prev => ({ ...prev, [key]: value }))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setParam(key, value || null), 250)
  }

  function toggleVenue(slug: string) {
    const set = new Set(currentVenueSlugs)
    if (set.has(slug)) set.delete(slug)
    else set.add(slug)
    const list = Array.from(set)
    setParam('venue', list.length ? list.join(',') : null)
  }

  function clearAll() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setText(Object.fromEntries(TEXT_KEYS.map(k => [k, ''])) as Record<TextKey, string>)
    push(new URLSearchParams())
  }

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  return (
    <aside className={classes.panel}>
      <div className={classes.header}>
        <h2 className={classes.heading}>Filters</h2>
        <button type="button" className={classes.clear} onClick={clearAll}>Clear</button>
      </div>

      <div className={classes.group}>
        <label className={classes.label} htmlFor="f-q">Search</label>
        <input
          id="f-q"
          className={classes.input}
          type="text"
          placeholder="title, excerpt, genre"
          value={text.q}
          onChange={e => onTextChange('q', e.target.value)}
        />
      </div>

      <fieldset className={classes.group}>
        <legend className={classes.label}>Venue</legend>
        <div className={classes.checkList}>
          {venues.map(v => (
            <label key={v.id} className={classes.check}>
              <input
                type="checkbox"
                checked={currentVenueSlugs.includes(v.slug)}
                onChange={() => toggleVenue(v.slug)}
              />
              <span>{v.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={classes.group}>
        <label className={classes.label}>Date range</label>
        <div className={classes.row}>
          <input
            className={classes.input}
            type="date"
            aria-label="From"
            value={text.date_from}
            onChange={e => onTextChange('date_from', e.target.value)}
          />
          <input
            className={classes.input}
            type="date"
            aria-label="To"
            value={text.date_to}
            onChange={e => onTextChange('date_to', e.target.value)}
          />
        </div>
      </div>

      <div className={classes.group}>
        <label className={classes.label} htmlFor="f-featured">Featured</label>
        <select
          id="f-featured"
          className={classes.input}
          value={featured}
          onChange={e => setParam('featured', e.target.value || null)}
        >
          <option value="">Any</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </select>
      </div>
    </aside>
  )
}
