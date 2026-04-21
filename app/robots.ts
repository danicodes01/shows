import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/admin/',
    },
    sitemap: 'https://distortnewyork.com/sitemap.xml',
  }
}
