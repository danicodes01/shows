'use server'

import { put } from '@vercel/blob'
import prisma from '@/lib/prisma'

type State = { success: boolean }

export async function submitContact(prevState: State, formData: FormData): Promise<State> {
  const email = formData.get('email') as string
  const title = formData.get('title') as string
  const date = formData.get('date') as string
  const venue = formData.get('venue') as string
  const genre = formData.get('genre') as string
  const time = formData.get('time') as string
  const price = formData.get('price') as string
  const excerpt = formData.get('excerpt') as string
  const imageFile = formData.get('image') as File | null

  const allEmpty = [email, title, date, venue, genre, time, price, excerpt].every(v => !v?.trim())
    && (!imageFile || imageFile.size === 0)
  if (allEmpty) return { success: false }

  let imageUrl = ''
  if (imageFile && imageFile.size > 0) {
    const blob = await put(imageFile.name, imageFile, { access: 'public', addRandomSuffix: true })
    imageUrl = blob.url
  }

  await prisma.contact.create({
    data: { email, title, date, venue, genre, time, price, excerpt, imageUrl },
  })

  return { success: true }
}
