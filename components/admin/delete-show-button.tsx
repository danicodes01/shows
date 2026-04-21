'use client'

import { useTransition } from 'react'
import { deleteShowAction } from '@/actions/admin/shows'
import classes from './delete-show-button.module.css'

export default function DeleteShowButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(() => {
      deleteShowAction(fd)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={classes.button}
    >
      {pending ? 'Deleting…' : 'Delete show'}
    </button>
  )
}
