'use client'

import { useActionState, useRef, useState } from 'react'
import type { Venue } from '@/lib/shows'
import { createShowAction, updateShowAction } from '@/actions/admin/shows'
import { postSubmissionAction } from '@/actions/admin/submissions'
import classes from './show-form.module.css'

export type ShowFormDefaults = {
  id?: string
  title?: string
  date?: Date | string | null
  genre?: string
  excerpt?: string
  time?: string
  price?: string
  image?: string
  ticketUrl?: string
  previewUrl?: string
  previewTrack?: string
  isFeatured?: boolean
  rating?: number
  venueId?: string
}

type Props = {
  mode: 'create' | 'edit' | 'submission'
  venues: Pick<Venue, 'id' | 'name'>[]
  defaults?: ShowFormDefaults
  contactId?: string
}

function toDateInputValue(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  // yyyy-MM-dd in the user's local time is what <input type="date"> expects.
  const tz = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - tz).toISOString().slice(0, 10)
}

export default function ShowForm({ mode, venues, defaults, contactId }: Props) {
  const action =
    mode === 'create'
      ? createShowAction
      : mode === 'edit'
        ? updateShowAction
        : postSubmissionAction
  const [state, formAction, pending] = useActionState(action, {})

  const [imageUrl, setImageUrl] = useState(defaults?.image ?? '')
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [venueSelection, setVenueSelection] = useState<string>(defaults?.venueId ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewSrc = filePreview || imageUrl
  const creatingVenue = venueSelection === '__new__'
  const submitLabel =
    mode === 'create'
      ? 'Create show'
      : mode === 'edit'
        ? 'Save changes'
        : 'Post show'

  const handleFile = (file: File | null) => {
    if (!file) {
      setFilePreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setFilePreview(url)
  }

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (fileInputRef.current) {
      const dt = new DataTransfer()
      dt.items.add(file)
      fileInputRef.current.files = dt.files
    }
    handleFile(file)
  }

  return (
    <form action={formAction} className={classes.form}>
      {mode === 'edit' && defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
      {mode === 'submission' && contactId && <input type="hidden" name="contactId" value={contactId} />}

      {state?.error && <p className={classes.error}>{state.error}</p>}

      <fieldset className={classes.section}>
        <legend>Basics</legend>
        <label className={classes.field}>
          <span>Title</span>
          <input name="title" required defaultValue={defaults?.title ?? ''} />
        </label>
        <label className={classes.field}>
          <span>Genre</span>
          <input name="genre" defaultValue={defaults?.genre ?? ''} placeholder="e.g. shoegaze, hardcore" />
        </label>
        <label className={classes.field}>
          <span>Excerpt</span>
          <textarea name="excerpt" rows={5} defaultValue={defaults?.excerpt ?? ''} />
        </label>
      </fieldset>

      <fieldset className={classes.section}>
        <legend>Scheduling</legend>
        <div className={classes.row}>
          <label className={classes.field}>
            <span>Date</span>
            <input
              name="date"
              type="date"
              required
              defaultValue={defaults?.date ? toDateInputValue(defaults.date) : ''}
            />
          </label>
          <label className={classes.field}>
            <span>Time</span>
            <input name="time" defaultValue={defaults?.time ?? ''} placeholder="e.g. 8:00 PM" />
          </label>
          <label className={classes.field}>
            <span>Price</span>
            <input name="price" defaultValue={defaults?.price ?? ''} placeholder="e.g. $15 or Free" />
          </label>
        </div>
        <label className={classes.field}>
          <span>Venue</span>
          <select
            name="venueId"
            required
            value={venueSelection}
            onChange={(e) => setVenueSelection(e.target.value)}
          >
            <option value="" disabled>Pick a venue…</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
            <option value="__new__">+ Add a new venue…</option>
          </select>
        </label>
        {creatingVenue && (
          <label className={classes.field}>
            <span>New venue name</span>
            <input
              name="newVenueName"
              required={creatingVenue}
              placeholder="e.g. Good Room"
            />
          </label>
        )}
      </fieldset>

      <fieldset className={classes.section}>
        <legend>Media</legend>
        <label className={classes.field}>
          <span>Image URL</span>
          <input
            name="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <div
          className={dragging ? classes.dropzoneActive : classes.dropzone}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
        >
          <span>Drop an image here, or click to pick a file.</span>
          <input
            ref={fileInputRef}
            type="file"
            name="imageFile"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            hidden
          />
        </div>
        {previewSrc && (
          <div className={classes.preview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt="Preview" />
          </div>
        )}
        <label className={classes.field}>
          <span>Ticket URL</span>
          <input name="ticketUrl" type="url" defaultValue={defaults?.ticketUrl ?? ''} placeholder="https://…" />
        </label>
        <div className={classes.row}>
          <label className={classes.field}>
            <span>Preview audio URL</span>
            <input name="previewUrl" type="url" defaultValue={defaults?.previewUrl ?? ''} />
          </label>
          <label className={classes.field}>
            <span>Preview track name</span>
            <input name="previewTrack" defaultValue={defaults?.previewTrack ?? ''} />
          </label>
        </div>
      </fieldset>

      <fieldset className={classes.section}>
        <legend>Publishing</legend>
        <div className={classes.row}>
          <label className={classes.checkField}>
            <input type="checkbox" name="isFeatured" defaultChecked={defaults?.isFeatured ?? false} />
            <span>Featured on home page</span>
          </label>
          <label className={classes.field}>
            <span>Rating (0–10)</span>
            <input
              name="rating"
              type="number"
              min={0}
              max={10}
              defaultValue={defaults?.rating ?? 0}
            />
          </label>
        </div>
      </fieldset>

      <div className={classes.actions}>
        <button type="submit" disabled={pending} className={classes.submit}>
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
