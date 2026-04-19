import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/admin/session-verify'

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (pathname === '/admin/login') return NextResponse.next()

  const username = process.env.ADMIN_USERNAME
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!username || !secret) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value
  const ok = await verifySessionToken(token, username, secret)
  if (ok) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/admin/login'
  url.search = `?next=${encodeURIComponent(pathname + search)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*'],
}
