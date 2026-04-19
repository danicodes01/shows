import type { Metadata } from 'next'
import LoginForm from './login-form'

export const metadata: Metadata = {
  title: 'Admin — Sign in',
  robots: { index: false, follow: false },
}

type SearchParams = Promise<{ next?: string }>

export default async function AdminLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams
  const safeNext = next && next.startsWith('/admin') ? next : '/admin'
  return <LoginForm next={safeNext} />
}
