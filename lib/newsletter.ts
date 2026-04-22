import prisma from './prisma'
import type { NewsletterModel as Newsletter, NewsletterSendModel as NewsletterSend } from './generated/prisma/models'

export type { Newsletter, NewsletterSend }

export async function getAllSubscribers(): Promise<Newsletter[]> {
  return prisma.newsletter.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function getRecentSends(limit = 20): Promise<NewsletterSend[]> {
  return prisma.newsletterSend.findMany({
    orderBy: { sentAt: 'desc' },
    take: limit,
  })
}
