'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { getAdmins } from '@/lib/admin/accounts'
import { clearSessionCookie, setSessionCookie } from '@/lib/admin/session'

type LoginState = { error?: string }

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const nextRaw = String(formData.get('next') ?? '/admin')
  const next = nextRaw.startsWith('/admin') ? nextRaw : '/admin'

  const admins = getAdmins()
  if (admins.length === 0) {
    return { error: 'Admin credentials are not configured' }
  }

  const match = admins.find((a) => a.username === username)
  const passOk =
    !!match && password.length > 0 && (await bcrypt.compare(password, match.hash))

  if (!match || !passOk) {
    return { error: 'Invalid credentials' }
  }

  await setSessionCookie(match.username)
  redirect(next)
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie()
  redirect('/admin/login')
}
