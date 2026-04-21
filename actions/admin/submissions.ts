'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { put } from '@vercel/blob'
import prisma from '@/lib/prisma'

type State = { error?: string; success?: boolean }

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base
  let i = 2
  while (true) {
    const existing = await prisma.show.findFirst({ where: { slug }, select: { id: true } })
    if (!existing) return slug
    slug = `${base}-${i++}`
  }
}

async function resolveVenueId(formData: FormData): Promise<string | null> {
  const raw = String(formData.get('venueId') ?? '').trim()
  if (raw && raw !== '__new__') return raw
  if (raw === '__new__') {
    const name = String(formData.get('newVenueName') ?? '').trim()
    if (!name) return null
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'venue'
    const existing = await prisma.venue.findFirst({
      where: { OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }] },
    })
    if (existing) return existing.id
    const created = await prisma.venue.create({ data: { name, slug } })
    return created.id
  }
  return null
}

async function resolveImage(formData: FormData, existing: string): Promise<string> {
  const file = formData.get('imageFile') as File | null
  const url = String(formData.get('imageUrl') ?? '').trim()
  if (file && file.size > 0) {
    const blob = await put(file.name, file, { access: 'public', addRandomSuffix: true })
    return blob.url
  }
  if (url) return url
  return existing
}

export async function postSubmissionAction(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const contactId = String(formData.get('contactId') ?? '').trim()
  if (!contactId) return { error: 'Missing submission id.' }

  const title = String(formData.get('title') ?? '').trim()
  const dateStr = String(formData.get('date') ?? '').trim()
  const venueId = await resolveVenueId(formData)
  if (!title || !dateStr || !venueId) {
    return { error: 'Title, date, and venue are required.' }
  }
  const parsedDate = new Date(dateStr)
  if (isNaN(parsedDate.getTime())) return { error: `Invalid date: ${dateStr}` }

  const submission = await prisma.contact.findUnique({ where: { id: contactId } })
  if (!submission) return { error: 'Submission not found.' }

  const image = await resolveImage(formData, submission.imageUrl)
  if (!image) return { error: 'An image is required (file or URL).' }

  const slug = await uniqueSlug(slugify(title) || 'show')

  await prisma.show.create({
    data: {
      slug,
      title,
      date: parsedDate,
      genre: String(formData.get('genre') ?? '').trim(),
      venueId,
      time: String(formData.get('time') ?? '').trim(),
      price: String(formData.get('price') ?? '').trim(),
      image,
      excerpt: String(formData.get('excerpt') ?? '').trim(),
      ticketUrl: String(formData.get('ticketUrl') ?? '').trim(),
      previewUrl: String(formData.get('previewUrl') ?? '').trim(),
      previewTrack: String(formData.get('previewTrack') ?? '').trim(),
      isFeatured: formData.get('isFeatured') === 'on',
      rating: parseInt(String(formData.get('rating') ?? '0'), 10) || 0,
    },
  })

  await prisma.contact.delete({ where: { id: contactId } })

  revalidatePath('/admin/submissions')
  revalidatePath('/admin/shows')
  revalidatePath('/shows')
  revalidatePath('/')
  redirect('/admin/submissions')
}

export async function deleteSubmissionAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  await prisma.contact.delete({ where: { id } })

  revalidatePath('/admin/submissions')
}
