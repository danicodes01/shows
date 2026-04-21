import { cookies } from 'next/headers'
import { getAdminUsernames } from './accounts'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSessionToken,
  verifySessionToken,
} from './session-verify'

export { SESSION_COOKIE, SESSION_MAX_AGE }

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set')
  return secret
}

export async function setSessionCookie(username: string): Promise<void> {
  const token = await signSessionToken(username, getSecret())
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return false
  const secret = getSecret()
  const usernames = getAdminUsernames()
  for (const username of usernames) {
    if (await verifySessionToken(token, username, secret)) return true
  }
  return false
}
