'use client'

import { useActionState, useState, useEffect, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { addComment, getComments } from '@/actions/comments'
import type { CommentModel } from '@/lib/generated/prisma/models'
import classes from './comments.module.css'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  )
}

export default function Comments({ showId }: { showId: string }) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<CommentModel[]>([])
  const [loadPending, startLoad] = useTransition()

  const boundAction = addComment.bind(null, showId)
  const [state, action] = useActionState(boundAction, { success: false })

  function toggle() {
    if (!open) {
      startLoad(async () => {
        const data = await getComments(showId)
        setComments(data)
      })
    }
    setOpen(prev => !prev)
  }

  useEffect(() => {
    if (state.success) {
      getComments(showId).then(setComments)
    }
  }, [state.success, showId])

  return (
    <section className={classes.comments}>
      <button onClick={toggle} disabled={loadPending}>
        {open ? 'Hide' : 'Show'} Comments
      </button>
      {open && (
        <>
          <form action={action} className={classes.form}>
            <div className={classes.row}>
              <div className={classes.control}>
                <label htmlFor="name">Name</label>
                <input type="text" id="name" name="name" required />
              </div>
              <div className={classes.control}>
                <label htmlFor="email">Email <span>(optional)</span></label>
                <input type="email" id="email" name="email" />
              </div>
            </div>
            <div className={classes.control}>
              <label htmlFor="text">Comment</label>
              <textarea id="text" name="text" rows={4} required />
            </div>
            <SubmitButton />
          </form>
          {comments.length > 0 && (
            <ul className={classes.list}>
              {comments.map(comment => (
                <li key={comment.id}>
                  <p>{comment.text}</p>
                  <div>By <address>{comment.name}</address></div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
