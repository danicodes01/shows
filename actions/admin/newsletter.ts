'use server'

import path from 'node:path'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { sendMail, type Attachment } from '@/lib/email'
import { markdownToHtml, markdownToPlainText, wrapEmailHtml } from '@/lib/markdown'
import { isAuthenticated } from '@/lib/admin/session'

const logoAttachment: Attachment = {
  filename: 'logo.png',
  path: path.join(process.cwd(), 'public', 'images', 'lightmodelogo.png'),
  cid: 'distort-logo',
}

type SendState = {
  success: boolean
  error?: string
  sentCount?: number
}

export async function sendNewsletterAction(
  _prev: SendState,
  formData: FormData,
): Promise<SendState> {
  const authed = await isAuthenticated()
  if (!authed) return { success: false, error: 'Not authorized' }

  const subject = String(formData.get('subject') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const recipientIdsRaw = String(formData.get('recipientIds') ?? '').trim()

  if (!subject) return { success: false, error: 'Subject is required' }
  if (!body) return { success: false, error: 'Body is required' }
  if (!recipientIdsRaw) return { success: false, error: 'Select at least one subscriber' }

  const recipientIds = recipientIdsRaw.split(',').map((s) => s.trim()).filter(Boolean)
  if (recipientIds.length === 0) {
    return { success: false, error: 'Select at least one subscriber' }
  }

  const subscribers = await prisma.newsletter.findMany({
    where: { id: { in: recipientIds } },
    select: { email: true },
  })
  if (subscribers.length === 0) {
    return { success: false, error: 'No valid subscribers found' }
  }

  const html = wrapEmailHtml(markdownToHtml(body))
  const text = markdownToPlainText(body)

  let sent = 0
  const errors: string[] = []
  for (const sub of subscribers) {
    try {
      await sendMail({ to: sub.email, subject, html, text, attachments: [logoAttachment] })
      sent += 1
    } catch (err) {
      errors.push(sub.email)
      console.error(`[newsletter] failed to send to ${sub.email}`, err)
    }
  }

  await prisma.newsletterSend.create({
    data: { subject, body, recipientCount: sent },
  })

  revalidatePath('/admin/newsletter')

  if (sent === 0) {
    return { success: false, error: `Failed to send. Check GMAIL_USERNAME/GMAIL_PASSWORD env.` }
  }
  if (errors.length > 0) {
    return {
      success: true,
      sentCount: sent,
      error: `Sent to ${sent} of ${subscribers.length}. Failed: ${errors.join(', ')}`,
    }
  }
  return { success: true, sentCount: sent }
}

export async function deleteSubscriberAction(formData: FormData): Promise<void> {
  const authed = await isAuthenticated()
  if (!authed) return
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await prisma.newsletter.delete({ where: { id } })
  revalidatePath('/admin/newsletter')
}

export async function deleteNewsletterSendAction(formData: FormData): Promise<void> {
  const authed = await isAuthenticated()
  if (!authed) return
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await prisma.newsletterSend.delete({ where: { id } })
  revalidatePath('/admin/newsletter')
}
