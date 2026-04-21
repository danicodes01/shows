import type { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

const SITE_URL = 'https://distortnewyork.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [shows, venues] = await Promise.all([
    prisma.show.findMany({
      select: { slug: true, updatedAt: true },
      where: { date: { gte: new Date() } },
    }),
    prisma.venue.findMany({ select: { slug: true } }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/shows`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/venues`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.3 },
  ]

  const showEntries: MetadataRoute.Sitemap = shows.map((s) => ({
    url: `${SITE_URL}/shows/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const venueEntries: MetadataRoute.Sitemap = venues.map((v) => ({
    url: `${SITE_URL}/venues/${v.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...showEntries, ...venueEntries]
}
