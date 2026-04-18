'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { subscribeNewsletter } from '@/actions/newsletter'
import classes from './newsletter.module.css'

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending || disabled}>
      {pending ? '...' : 'REGISTER'}
    </button>
  )
}

export default function Newsletter() {
  const [state, action] = useActionState(subscribeNewsletter, { success: false })
  const [email, setEmail] = useState('')

  return (
    <section className={classes.newsletter}>
      <h2>register to occasionally recieve weekly updates</h2>
      <form action={action}>
        <div className={`${classes.control} ${state.success ? classes.controlDisabled : ''}`}>
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            aria-label="Your Email"
            required
            disabled={state.success}
            value={state.success ? 'nom nom nom' : email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <SubmitButton disabled={state.success} />
        </div>
      </form>
    </section>
  )
}
