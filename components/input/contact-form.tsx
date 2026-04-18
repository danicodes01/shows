'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitContact } from '@/actions/contact'
import classes from './contact-form.module.css'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  )
}

export default function ContactForm() {
  const [state, action] = useActionState(submitContact, { success: false })
  const [fileName, setFileName] = useState('Upload Flyer')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name.length > 20 ? `${file.name.substring(0, 17)}...` : file.name)
    }
  }

  if (state.success) {
    return (
      <section className={classes.contact}>
        <p>thanks 💀</p>
      </section>
    )
  }

  return (
    <section className={classes.contact}>
      <h2>Submit event info</h2>
      <p>No single field is required — anything you submit could get posted</p>
      <form action={action} className={classes.form}>
        <div className={classes.controls}>
          {[
            { id: 'title', label: 'Title' },
            { id: 'venue', label: 'Venue' },
            { id: 'date', label: 'Date' },
            { id: 'time', label: 'Time' },
            { id: 'price', label: 'Price' },
            { id: 'genre', label: 'Genre' },
          ].map(({ id, label }) => (
            <div key={id} className={classes.control}>
              <label htmlFor={id}>{label}</label>
              <textarea id={id} name={id} rows={1} />
            </div>
          ))}
          <div className={classes.control}>
            <label htmlFor="excerpt">Details</label>
            <textarea id="excerpt" name="excerpt" rows={3} />
          </div>
          <div className={classes.control}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" />
          </div>
          <div className={classes.control}>
            <label className={classes.fileInputLabel} htmlFor="image">{fileName}</label>
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
    </section>
  )
}
