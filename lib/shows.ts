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

function startOfTodayNY(): Date {
  const nyDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  return new Date(`${nyDate}T00:00:00.000Z`)
}

export async function getAllShows(
  { page = 1, perPage = SHOWS_PER_PAGE }: { page?: number; perPage?: number } = {},
): Promise<{ items: ShowWithVenue[]; total: number }> {
  const where = { date: { gte: startOfTodayNY() } }
  const [items, total] = await Promise.all([
    prisma.show.findMany({
      where,
      orderBy: { date: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: withVenue,
    }),
    prisma.show.count({ where }),
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

export const ADMIN_SHOWS_PER_PAGE = 25

export type AdminShowFilters = {
  q?: string
  title?: string
  slug?: string
  venueSlugs?: string[]
  genre?: string
  dateFrom?: string
  dateTo?: string
  isFeatured?: boolean
  ratingMin?: number
  ratingMax?: number
  hasImage?: boolean
  hasTicketUrl?: boolean
  hasExcerpt?: boolean
}

function buildAdminWhere(f: AdminShowFilters) {
  const AND: Record<string, unknown>[] = []

  if (f.q) {
    AND.push({
      OR: [
        { title: { contains: f.q, mode: 'insensitive' } },
        { excerpt: { contains: f.q, mode: 'insensitive' } },
        { genre: { contains: f.q, mode: 'insensitive' } },
      ],
    })
  }
  if (f.title) AND.push({ title: { contains: f.title, mode: 'insensitive' } })
  if (f.slug) AND.push({ slug: { contains: f.slug, mode: 'insensitive' } })
  if (f.genre) AND.push({ genre: { contains: f.genre, mode: 'insensitive' } })
  if (f.venueSlugs?.length) AND.push({ venue: { slug: { in: f.venueSlugs } } })

  if (f.dateFrom || f.dateTo) {
    const range: Record<string, Date> = {}
    if (f.dateFrom) range.gte = new Date(`${f.dateFrom}T00:00:00.000Z`)
    if (f.dateTo) range.lte = new Date(`${f.dateTo}T23:59:59.999Z`)
    AND.push({ date: range })
  }

  if (typeof f.isFeatured === 'boolean') AND.push({ isFeatured: f.isFeatured })

  if (typeof f.ratingMin === 'number' || typeof f.ratingMax === 'number') {
    const range: Record<string, number> = {}
    if (typeof f.ratingMin === 'number') range.gte = f.ratingMin
    if (typeof f.ratingMax === 'number') range.lte = f.ratingMax
    AND.push({ rating: range })
  }

  if (f.hasImage === true) AND.push({ NOT: { image: '' } })
  if (f.hasImage === false) AND.push({ image: '' })
  if (f.hasTicketUrl === true) AND.push({ NOT: { ticketUrl: '' } })
  if (f.hasTicketUrl === false) AND.push({ ticketUrl: '' })
  if (f.hasExcerpt === true) AND.push({ NOT: { excerpt: '' } })
  if (f.hasExcerpt === false) AND.push({ excerpt: '' })

  return AND.length ? { AND } : {}
}

export async function getShowsForAdmin(
  filters: AdminShowFilters,
  { page = 1, perPage = ADMIN_SHOWS_PER_PAGE }: { page?: number; perPage?: number } = {},
): Promise<{ items: ShowWithVenue[]; total: number }> {
  const where = buildAdminWhere(filters)
  const [items, total] = await Promise.all([
    prisma.show.findMany({
      where,
      orderBy: { date: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: withVenue,
    }),
    prisma.show.count({ where }),
  ])
  return { items, total }
}

export async function upsertVenue(name: string, slug: string, data?: Partial<Venue>): Promise<Venue> {
  return prisma.venue.upsert({
    where: { slug },
    update: data ?? {},
    create: { name, slug, ...data },
  })
}
