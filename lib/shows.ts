import prisma from './prisma'
import type { ShowModel as Show, VenueModel as Venue } from './generated/prisma/models'

export type { Show, Venue }

export type ShowWithVenue = Show & { venue: Venue }

const withVenue = { venue: true } as const

export async function getFeaturedShows(): Promise<ShowWithVenue[]> {
  return prisma.show.findMany({
    where: { isFeatured: true },
    orderBy: { rating: 'asc' },
    take: 8,
    include: withVenue,
  })
}

export const SHOWS_PER_PAGE = 12

export async function getAllShows(
  { page = 1, perPage = SHOWS_PER_PAGE }: { page?: number; perPage?: number } = {},
): Promise<{ items: ShowWithVenue[]; total: number }> {
  const [items, total] = await Promise.all([
    prisma.show.findMany({
      orderBy: { date: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: withVenue,
    }),
    prisma.show.count(),
  ])
  return { items, total }
}

export async function getShowBySlug(slug: string): Promise<ShowWithVenue | null> {
  return prisma.show.findFirst({
    where: { slug },
    include: withVenue,
  })
}

export async function searchShows(query: string): Promise<ShowWithVenue[]> {
  return prisma.show.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { genre: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
        { venue: { name: { contains: query, mode: 'insensitive' } } },
      ],
    },
    orderBy: { date: 'asc' },
    include: withVenue,
  })
}

export async function getShowsByDate(year: string, month: string): Promise<ShowWithVenue[]> {
  const start = new Date(parseInt(year), parseInt(month) - 1, 1)
  const end = new Date(parseInt(year), parseInt(month), 1)
  return prisma.show.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: { date: 'asc' },
    include: withVenue,
  })
}

export async function getAllVenues(): Promise<Venue[]> {
  return prisma.venue.findMany({ orderBy: { name: 'asc' } })
}

export async function getVenueBySlug(slug: string) {
  return prisma.venue.findFirst({
    where: { slug },
    include: {
      shows: {
        orderBy: { date: 'asc' },
        include: withVenue,
      },
    },
  })
}

export async function upsertVenue(name: string, slug: string, data?: Partial<Venue>): Promise<Venue> {
  return prisma.venue.upsert({
    where: { slug },
    update: data ?? {},
    create: { name, slug, ...data },
  })
}
