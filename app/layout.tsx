import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import MainNav from '@/components/layout/main-nav'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'DistortNewYork',
  description: 'Shows in NYC and all boroughs',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MainNav />
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  )
}
