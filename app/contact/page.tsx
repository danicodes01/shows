import type { Metadata } from 'next'
import Link from 'next/link'
import ContactForm from '@/components/input/contact-form'
import CategoryFilter from '@/components/input/category-filter'
import { getAllResourceCategories, getAllResources } from '@/lib/resources'
import classes from './page.module.css'

export const metadata: Metadata = {
  title: 'DistortNewYork — Info / Submit',
  description: 'Share your thoughts, or promote a show / event',
  alternates: { canonical: '/contact' },
}

const CONTACT = {
  email: 'contact@distortnewyork.com',
  donateUrl: 'https://donate.stripe.com/5kA7wegxI9Bme4g289',
}

interface ContactPageProps {
  searchParams: Promise<{ cat?: string }>
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { cat } = await searchParams
  const [resources, categories] = await Promise.all([
    getAllResources(),
    getAllResourceCategories(),
  ])

  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]))
  const activeCategorySlug = cat && categoryBySlug.has(cat) ? cat : ''

  const filtered = activeCategorySlug
    ? resources.filter((r) => r.category.slug === activeCategorySlug)
    : resources

  const filterOptions = categories
    .map((c) => ({
      value: c.slug,
      label: c.name,
      count: resources.filter((r) => r.category.slug === c.slug).length,
    }))
    .filter((o) => o.count > 0)

  return (
    <section className={classes.wrap}>
      <header className={classes.hero}>
        <h1 className={classes.title}>Info / Submit</h1>
        <p className={classes.tagline}>
          Submit a show, reach out, donate, or explore organizations worth knowing.
        </p>
      </header>

      <article className={classes.support}>
        <h2 className={classes.supportHeading}>Support DistortNewYork</h2>
        <div className={classes.supportActions}>
          <a className={classes.pillLink} href={`mailto:${CONTACT.email}`}>
            Write us
          </a>
          <Link
            className={classes.pillLink}
            href={CONTACT.donateUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Donate 🖤
          </Link>
        </div>
      </article>

      <section className={classes.formSection}>
        <h2 className={classes.sectionHeading}>Submit a show</h2>
        <ContactForm />
      </section>

      <section className={classes.resourcesSection}>
        <h2 className={classes.sectionHeading}>Resources</h2>
        <CategoryFilter
          options={filterOptions}
          active={activeCategorySlug}
          totalCount={resources.length}
        />
        <ul className={classes.grid}>
          {filtered.map((r) => (
            <li key={r.id}>
              <Link
                className={classes.card}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className={classes.cardBody}>
                  <span className={classes.category}>{r.category.name}</span>
                  <h3 className={classes.cardTitle}>{r.name}</h3>
                  <p className={classes.cardDesc}>{r.description}</p>
                  <span className={classes.cta} aria-hidden="true">
                    {r.cta} →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
