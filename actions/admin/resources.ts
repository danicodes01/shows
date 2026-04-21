'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { slugifyCategory } from '@/lib/resources'

type ResourceFormState = { error?: string; success?: boolean }

async function resolveCategoryId(formData: FormData): Promise<string | null> {
  const raw = String(formData.get('categoryId') ?? '').trim()
  if (raw && raw !== '__new__') return raw
  if (raw === '__new__') {
    const name = String(formData.get('newCategoryName') ?? '').trim()
    if (!name) return null
    const slug = slugifyCategory(name)
    const existing = await prisma.resourceCategory.findFirst({
      where: { OR: [{ name }, { slug }] },
    })
    if (existing) return existing.id
    const maxOrder = await prisma.resourceCategory.aggregate({
      _max: { sortOrder: true },
    })
    const created = await prisma.resourceCategory.create({
      data: {
        name,
        slug,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    })
    return created.id
  }
  return null
}

function parseForm(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    url: String(formData.get('url') ?? '').trim(),
    cta: String(formData.get('cta') ?? '').trim(),
    sortOrder: Number(formData.get('sortOrder') ?? 0) || 0,
  }
}

function validate(fields: ReturnType<typeof parseForm>, categoryId: string | null): string | null {
  if (!fields.name) return 'Name is required'
  if (!fields.description) return 'Description is required'
  if (!fields.url) return 'URL is required'
  if (!fields.cta) return 'CTA text is required'
  if (!categoryId) return 'Category is required'
  try {
    new URL(fields.url)
  } catch {
    return 'URL must be a valid web address (include https://)'
  }
  return null
}

export async function createResourceAction(
  _prev: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  const fields = parseForm(formData)
  const categoryId = await resolveCategoryId(formData)
  const err = validate(fields, categoryId)
  if (err) return { error: err }

  const maxOrder = await prisma.resource.aggregate({ _max: { sortOrder: true } })
  const order = fields.sortOrder || (maxOrder._max.sortOrder ?? 0) + 1

  await prisma.resource.create({
    data: {
      name: fields.name,
      description: fields.description,
      url: fields.url,
      cta: fields.cta,
      sortOrder: order,
      categoryId: categoryId!,
    },
  })

  revalidatePath('/contact')
  revalidatePath('/admin/resources')
  redirect('/admin/resources')
}

export async function updateResourceAction(
  _prev: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Missing resource id' }
  const fields = parseForm(formData)
  const categoryId = await resolveCategoryId(formData)
  const err = validate(fields, categoryId)
  if (err) return { error: err }

  await prisma.resource.update({
    where: { id },
    data: {
      name: fields.name,
      description: fields.description,
      url: fields.url,
      cta: fields.cta,
      sortOrder: fields.sortOrder,
      categoryId: categoryId!,
    },
  })

  revalidatePath('/contact')
  revalidatePath('/admin/resources')
  redirect('/admin/resources')
}

export async function deleteResourceAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await prisma.resource.delete({ where: { id } })
  revalidatePath('/contact')
  revalidatePath('/admin/resources')
}
