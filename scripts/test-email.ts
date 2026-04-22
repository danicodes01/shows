import '../scrapers/lib/env'
import path from 'node:path'
import nodemailer from 'nodemailer'

async function main() {
  const to = process.argv[2]
  if (!to) {
    console.error('Usage: npm run test:email -- <your-email@example.com>')
    process.exit(1)
  }

  const user = process.env.GMAIL_USERNAME
  const pass = process.env.GMAIL_PASSWORD
  if (!user || !pass) {
    console.error('✗ GMAIL_USERNAME and GMAIL_PASSWORD must be set in .env.local')
    process.exit(1)
  }

  console.log(`→ Sending test email from ${user} to ${to}...`)

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  try {
    await transporter.verify()
    console.log('✓ SMTP credentials verified')
  } catch (err) {
    console.error('✗ SMTP verification failed:', err)
    process.exit(1)
  }

  try {
    const info = await transporter.sendMail({
      from: `DistortNewYork <${user}>`,
      to,
      subject: 'DistortNewYork newsletter test',
      text: 'This is a test email from the DistortNewYork newsletter system. If you received this, your Gmail app password is working.',
      html: `<div style="font-family:-apple-system,sans-serif;"><img src="cid:distort-logo" alt="DistortNewYork" width="120" style="display:block;margin-bottom:16px;" /><p>This is a test email from the <strong>DistortNewYork</strong> newsletter system. If you received this, your Gmail app password is working.</p></div>`,
      attachments: [
        {
          filename: 'logo.png',
          path: path.join(process.cwd(), 'public', 'images', 'lightmodelogo.png'),
          cid: 'distort-logo',
        },
      ],
    })
    console.log(`✓ Sent. messageId: ${info.messageId}`)
  } catch (err) {
    console.error('✗ Send failed:', err)
    process.exit(1)
  }
}

main()
