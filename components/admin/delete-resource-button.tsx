'use client'

import { useTransition } from 'react'
import { deleteResourceAction } from '@/actions/admin/resources'
import classes from './delete-show-button.module.css'

export default function DeleteResourceButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm(`Delete resource "${name}"? This cannot be undone.`)) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(() => {
      deleteResourceAction(fd)
    })
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className={classes.button}>
      {pending ? '…' : 'Delete'}
    </button>
  )
}
