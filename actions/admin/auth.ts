'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { clearSessionCookie, setSessionCookie } from '@/lib/admin/session'

type LoginState = { error?: string }

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const nextRaw = String(formData.get('next') ?? '/admin')
  const next = nextRaw.startsWith('/admin') ? nextRaw : '/admin'

  const expectedUser = process.env.ADMIN_USERNAME
  const hash = process.env.ADMIN_PASSWORD_HASH

  if (!expectedUser || !hash) {
    return { error: 'Admin credentials are not configured' }
  }

  const userOk = username.length > 0 && username === expectedUser
  const passOk = password.length > 0 && (await bcrypt.compare(password, hash))

  if (!userOk || !passOk) {
    return { error: 'Invalid credentials' }
  }

  await setSessionCookie(expectedUser)
  redirect(next)
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie()
  redirect('/admin/login')
}
