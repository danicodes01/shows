import nodemailer from 'nodemailer'

let cachedTransporter: nodemailer.Transporter | null = null

export type Attachment = {
  filename: string
  path: string
  cid: string
}

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter
  const user = process.env.GMAIL_USERNAME
  const pass = process.env.GMAIL_PASSWORD
  if (!user || !pass) {
    throw new Error('GMAIL_USERNAME and GMAIL_PASSWORD must be set')
  }
  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
  return cachedTransporter
}

export async function sendMail({
  to,
  subject,
  html,
  text,
  attachments,
}: {
  to: string
  subject: string
  html: string
  text: string
  attachments?: Attachment[]
}): Promise<void> {
  const transporter = getTransporter()
  const from = process.env.GMAIL_FROM || process.env.GMAIL_USERNAME!
  await transporter.sendMail({
    from: `DistortNewYork <${from}>`,
    to,
    subject,
    html,
    text,
    attachments,
  })
}
