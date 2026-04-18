'use server'

import prisma from '@/lib/prisma'

type State = { success: boolean; error?: string }

export async function subscribeNewsletter(prevState: State, formData: FormData): Promise<State> {
  const email = formData.get('email') as string

  if (!email?.includes('@')) {
    return { success: false, error: 'Invalid email' }
  }

  const existing = await prisma.newsletter.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'Already subscribed' }
  }

  await prisma.newsletter.create({ data: { email } })
  return { success: true }
}
