import type { AdminShowFilters } from '@/lib/shows'

export type AdminShowsSearchParams = {
  q?: string
  title?: string
  slug?: string
  venue?: string | string[]
  genre?: string
  date_from?: string
  date_to?: string
  featured?: string
  rating_min?: string
  rating_max?: string
  has_image?: string
  has_ticket?: string
  has_excerpt?: string
  page?: string
}

function asString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

function asTriBool(v: string | undefined): boolean | undefined {
  if (v === 'true') return true
  if (v === 'false') return false
  return undefined
}

function asNumber(v: string | undefined): number | undefined {
  if (!v) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function asVenueSlugs(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined
  const raw = Array.isArray(v) ? v.join(',') : v
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
  return parts.length ? parts : undefined
}

export function parseAdminShowsParams(sp: AdminShowsSearchParams): {
  filters: AdminShowFilters
  page: number
} {
  const filters: AdminShowFilters = {
    q: asString(sp.q) || undefined,
    title: asString(sp.title) || undefined,
    slug: asString(sp.slug) || undefined,
    venueSlugs: asVenueSlugs(sp.venue),
    genre: asString(sp.genre) || undefined,
    dateFrom: asString(sp.date_from) || undefined,
    dateTo: asString(sp.date_to) || undefined,
    isFeatured: asTriBool(asString(sp.featured)),
    ratingMin: asNumber(asString(sp.rating_min)),
    ratingMax: asNumber(asString(sp.rating_max)),
    hasImage: asTriBool(asString(sp.has_image)),
    hasTicketUrl: asTriBool(asString(sp.has_ticket)),
    hasExcerpt: asTriBool(asString(sp.has_excerpt)),
  }
  const page = Math.max(1, asNumber(asString(sp.page)) ?? 1)
  return { filters, page }
}
