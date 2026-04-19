'use client'

import Image from 'next/image'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction } from '@/actions/admin/auth'
import classes from './login.module.css'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={classes.submit}>
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  )
}

export default function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, {})

  return (
    <section className={classes.wrap}>
      <div className={classes.brand}>
        <Image
          src="/images/logo.PNG"
          alt="Distort New York"
          width={64}
          height={64}
          className={classes.logo}
          priority
        />
        <h1 className={classes.title}>Admin</h1>
      </div>
      <form action={action} className={classes.form}>
        <input type="hidden" name="next" value={next} />
        <label className={classes.label} htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          className={classes.input}
        />
        <label className={classes.label} htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={classes.input}
        />
        {state.error ? <p className={classes.error}>{state.error}</p> : null}
        <SubmitButton />
      </form>
    </section>
  )
}
