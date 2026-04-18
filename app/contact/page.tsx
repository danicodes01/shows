import type { Metadata } from 'next'
import Donate from '@/components/donate/donate'
import ContactForm from '@/components/input/contact-form'
import ContactBody from '@/components/input/contact-body'

export const metadata: Metadata = {
  title: 'DistortNewYork — Info / Submit',
  description: 'Share your thoughts, or promote a show / event',
}

export default function ContactPage() {
  return (
    <>
      <Donate />
      <ContactForm />
      <ContactBody />
    </>
  )
}
