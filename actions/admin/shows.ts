'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

export async function toggleFeaturedAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const next = formData.get('next') === 'true'
  if (!id) return

  await prisma.show.update({
    where: { id },
    data: { isFeatured: next },
  })

  revalidatePath('/admin/shows')
  revalidatePath('/')
}
