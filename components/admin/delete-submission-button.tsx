'use client'

import { useTransition } from 'react'
import { deleteSubmissionAction } from '@/actions/admin/submissions'
import classes from './delete-show-button.module.css'

export default function DeleteSubmissionButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm(`Delete submission "${title}"? This cannot be undone.`)) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(() => {
      deleteSubmissionAction(fd)
    })
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className={classes.button}>
      {pending ? '…' : 'Delete'}
    </button>
  )
}
