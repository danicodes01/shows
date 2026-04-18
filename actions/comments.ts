'use server'

import prisma from '@/lib/prisma'

type State = { success: boolean }

export async function addComment(showId: string, prevState: State, formData: FormData): Promise<State> {
  const name = formData.get('name') as string
  const text = formData.get('text') as string
  const email = (formData.get('email') as string) ?? ''

  if (!name?.trim() || !text?.trim()) return { success: false }

  await prisma.comment.create({ data: { showId, email, name, text } })
  return { success: true }
}

export async function getComments(showId: string) {
  return prisma.comment.findMany({
    where: { showId },
    orderBy: { createdAt: 'asc' },
  })
}
