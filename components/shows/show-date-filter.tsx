'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import classes from './show-date-filter.module.css'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 4 }, (_, i) => currentYear - 1 + i)

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

export default function ShowDateFilter() {
  const router = useRouter()
  const [year, setYear] = useState(currentYear.toString())
  const [month, setMonth] = useState('1')

  function submitHandler(event: React.FormEvent) {
    event.preventDefault()
    router.push(`/shows?year=${year}&month=${month}`)
  }

  return (
    <form className={classes.form} onSubmit={submitHandler}>
      <div className={classes.controls}>
        <div className={classes.control}>
          <label htmlFor="year">Year</label>
          <select id="year" value={year} onChange={e => setYear(e.target.value)}>
            {years.map(y => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>
        </div>
        <div className={classes.control}>
          <label htmlFor="month">Month</label>
          <select id="month" value={month} onChange={e => setMonth(e.target.value)}>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit">Search</button>
    </form>
  )
}
