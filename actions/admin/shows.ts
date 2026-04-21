'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { put } from '@vercel/blob'
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

type ShowFormState = { error?: string; success?: boolean }

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
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

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  let slug = base
  let i = 2
  // Very small set of shows per-run; linear probing is fine.
  while (true) {
    const existing = await prisma.show.findFirst({
      where: { slug, NOT: ignoreId ? { id: ignoreId } : undefined },
      select: { id: true },
    })
    if (!existing) return slug
    slug = `${base}-${i++}`
  }
}

function parseFormValues(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const dateStr = String(formData.get('date') ?? '').trim()
  const time = String(formData.get('time') ?? '').trim()
  const price = String(formData.get('price') ?? '').trim()
  const genre = String(formData.get('genre') ?? '').trim()
  const excerpt = String(formData.get('excerpt') ?? '').trim()
  const ticketUrl = String(formData.get('ticketUrl') ?? '').trim()
  const previewUrl = String(formData.get('previewUrl') ?? '').trim()
  const previewTrack = String(formData.get('previewTrack') ?? '').trim()
  const isFeatured = formData.get('isFeatured') === 'on'
  const rating = parseInt(String(formData.get('rating') ?? '0'), 10) || 0
  return {
    title,
    dateStr,
    time,
    price,
    genre,
    excerpt,
    ticketUrl,
    previewUrl,
    previewTrack,
    isFeatured,
    rating,
  }
}

export async function createShowAction(
  _prev: ShowFormState,
  formData: FormData,
): Promise<ShowFormState> {
  const v = parseFormValues(formData)
  const venueId = await resolveVenueId(formData)
  if (!v.title || !v.dateStr || !venueId) {
    return { error: 'Title, date, and venue are required.' }
  }
  const parsedDate = new Date(v.dateStr)
  if (isNaN(parsedDate.getTime())) return { error: `Invalid date: ${v.dateStr}` }

  const image = await resolveImage(formData, '')
  if (!image) return { error: 'An image is required (file or URL).' }

  const slug = await uniqueSlug(slugify(v.title) || 'show')

  await prisma.show.create({
    data: {
      slug,
      title: v.title,
      date: parsedDate,
      genre: v.genre,
      venueId,
      time: v.time,
      price: v.price,
      image,
      excerpt: v.excerpt,
      ticketUrl: v.ticketUrl,
      previewUrl: v.previewUrl,
      previewTrack: v.previewTrack,
      isFeatured: v.isFeatured,
      rating: v.rating,
    },
  })

  revalidatePath('/admin/shows')
  revalidatePath('/shows')
  revalidatePath('/')
  redirect('/admin/shows')
}

export async function updateShowAction(
  _prev: ShowFormState,
  formData: FormData,
): Promise<ShowFormState> {
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'Missing show id.' }

  const v = parseFormValues(formData)
  const venueId = await resolveVenueId(formData)
  if (!v.title || !v.dateStr || !venueId) {
    return { error: 'Title, date, and venue are required.' }
  }
  const parsedDate = new Date(v.dateStr)
  if (isNaN(parsedDate.getTime())) return { error: `Invalid date: ${v.dateStr}` }

  const current = await prisma.show.findUnique({ where: { id }, select: { image: true } })
  if (!current) return { error: 'Show not found.' }

  const image = await resolveImage(formData, current.image)
  if (!image) return { error: 'An image is required (file or URL).' }

  await prisma.show.update({
    where: { id },
    data: {
      title: v.title,
      date: parsedDate,
      genre: v.genre,
      venueId,
      time: v.time,
      price: v.price,
      image,
      excerpt: v.excerpt,
      ticketUrl: v.ticketUrl,
      previewUrl: v.previewUrl,
      previewTrack: v.previewTrack,
      isFeatured: v.isFeatured,
      rating: v.rating,
    },
  })

  revalidatePath('/admin/shows')
  revalidatePath(`/admin/shows/${id}`)
  revalidatePath('/shows')
  revalidatePath('/')
  redirect('/admin/shows')
}

export async function deleteShowAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  await prisma.show.delete({ where: { id } })

  revalidatePath('/admin/shows')
  revalidatePath('/shows')
  revalidatePath('/')
  redirect('/admin/shows')
}
