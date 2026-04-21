import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/admin/session-verify'

function splitEnv(value: string | undefined): string[] {
  if (!value) return []
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (pathname === '/admin/login') return NextResponse.next()

  const usernames = splitEnv(process.env.ADMIN_USERNAME)
  const secret = process.env.ADMIN_SESSION_SECRET

  if (usernames.length === 0 || !secret) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value
  let ok = false
  for (const username of usernames) {
    if (await verifySessionToken(token, username, secret)) {
      ok = true
      break
    }
  }
  if (ok) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/admin/login'
  url.search = `?next=${encodeURIComponent(pathname + search)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*'],
}
