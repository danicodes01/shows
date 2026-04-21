'use client'

import { useActionState, useState } from 'react'
import type { ResourceCategory } from '@/lib/resources'
import { createResourceAction, updateResourceAction } from '@/actions/admin/resources'
import classes from './show-form.module.css'

export type ResourceFormDefaults = {
  id?: string
  name?: string
  description?: string
  url?: string
  cta?: string
  sortOrder?: number
  categoryId?: string
}

type Props = {
  mode: 'create' | 'edit'
  categories: ResourceCategory[]
  defaults?: ResourceFormDefaults
}

export default function ResourceForm({ mode, categories, defaults }: Props) {
  const action = mode === 'create' ? createResourceAction : updateResourceAction
  const [state, formAction, pending] = useActionState(action, {})
  const [categorySelection, setCategorySelection] = useState<string>(defaults?.categoryId ?? '')
  const creatingCategory = categorySelection === '__new__'

  const submitLabel = mode === 'create' ? 'Create resource' : 'Save changes'

  return (
    <form action={formAction} className={classes.form}>
      {mode === 'edit' && defaults?.id && <input type="hidden" name="id" value={defaults.id} />}

      {state?.error && <p className={classes.error}>{state.error}</p>}

      <fieldset className={classes.section}>
        <legend>Basics</legend>
        <label className={classes.field}>
          <span>Name</span>
          <input name="name" required defaultValue={defaults?.name ?? ''} />
        </label>
        <label className={classes.field}>
          <span>Description</span>
          <textarea name="description" rows={4} required defaultValue={defaults?.description ?? ''} />
        </label>
        <label className={classes.field}>
          <span>Category</span>
          <select
            name="categoryId"
            required
            value={categorySelection}
            onChange={(e) => setCategorySelection(e.target.value)}
          >
            <option value="" disabled>Pick a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            <option value="__new__">+ Add a new category…</option>
          </select>
        </label>
        {creatingCategory && (
          <label className={classes.field}>
            <span>New category name</span>
            <input
              name="newCategoryName"
              required={creatingCategory}
              placeholder="e.g. Climate"
            />
          </label>
        )}
      </fieldset>

      <fieldset className={classes.section}>
        <legend>Link</legend>
        <label className={classes.field}>
          <span>URL</span>
          <input
            name="url"
            type="url"
            required
            defaultValue={defaults?.url ?? ''}
            placeholder="https://…"
          />
        </label>
        <label className={classes.field}>
          <span>CTA text</span>
          <input
            name="cta"
            required
            defaultValue={defaults?.cta ?? ''}
            placeholder="e.g. example.org or @handle"
          />
        </label>
      </fieldset>

      <fieldset className={classes.section}>
        <legend>Ordering</legend>
        <label className={classes.field}>
          <span>Sort order</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={defaults?.sortOrder ?? 0}
            placeholder="Lower numbers appear first"
          />
        </label>
      </fieldset>

      <button type="submit" className={classes.submit} disabled={pending}>
        {pending ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
