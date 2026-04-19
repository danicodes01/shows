'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitContact } from '@/actions/contact'
import classes from './contact-form.module.css'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={classes.submit}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  )
}

const SHORT_FIELDS: { id: string; label: string; type?: string }[] = [
  { id: 'title', label: 'Title' },
  { id: 'venue', label: 'Venue' },
  { id: 'date', label: 'Date' },
  { id: 'time', label: 'Time' },
  { id: 'price', label: 'Price' },
  { id: 'genre', label: 'Genre' },
]

export default function ContactForm() {
  const [state, action] = useActionState(submitContact, { success: false })
  const [fileName, setFileName] = useState('Upload flyer')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name.length > 24 ? `${file.name.substring(0, 21)}...` : file.name)
    }
  }

  if (state.success) {
    return (
      <section className={classes.card}>
        <p className={classes.thanks}>thanks 💀</p>
      </section>
    )
  }

  return (
    <form action={action} className={classes.card}>
      <p className={classes.disclaimer}>
        No single field is required — anything you submit could get posted.
      </p>

      <div className={classes.grid}>
        {SHORT_FIELDS.map(({ id, label }) => (
          <label key={id} className={classes.field}>
            <span className={classes.label}>{label}</span>
            <input id={id} name={id} type="text" className={classes.input} />
          </label>
        ))}

        <label className={`${classes.field} ${classes.fieldWide}`}>
          <span className={classes.label}>Email</span>
          <input id="email" name="email" type="email" className={classes.input} />
        </label>

        <label className={`${classes.field} ${classes.fieldWide}`}>
          <span className={classes.label}>Details</span>
          <textarea id="excerpt" name="excerpt" rows={4} className={classes.input} />
        </label>

        <div className={`${classes.field} ${classes.fieldWide}`}>
          <label className={classes.fileLabel} htmlFor="image">
            <span className={classes.fileIcon} aria-hidden>📎</span>
            <span>{fileName}</span>
          </label>
          <input
            className={classes.fileInput}
            type="file"
            id="image"
            name="image"
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>
      </div>

      <SubmitButton />
    </form>
  )
}
