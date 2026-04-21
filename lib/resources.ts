import prisma from '@/lib/prisma'
import type { ResourceModel, ResourceCategoryModel } from '@/lib/generated/prisma/models'

export type Resource = ResourceModel
export type ResourceCategory = ResourceCategoryModel
export type ResourceWithCategory = ResourceModel & { category: ResourceCategoryModel }

export async function getAllResources(): Promise<ResourceWithCategory[]> {
  return prisma.resource.findMany({
    include: { category: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function getResourceById(id: string): Promise<ResourceWithCategory | null> {
  return prisma.resource.findUnique({
    where: { id },
    include: { category: true },
  })
}

export async function getAllResourceCategories(): Promise<ResourceCategory[]> {
  return prisma.resourceCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
}

export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
