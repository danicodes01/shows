import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const nyDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const cutoff = new Date(`${nyDate}T00:00:00.000Z`)

  const { count } = await prisma.show.deleteMany({ where: { date: { lt: cutoff } } })
  return NextResponse.json({ deleted: count, cutoff: cutoff.toISOString() })
}
