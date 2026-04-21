import type { Metadata } from 'next'
import Link from 'next/link'
import ContactForm from '@/components/input/contact-form'
import CategoryFilter from '@/components/input/category-filter'
import classes from './page.module.css'

export const metadata: Metadata = {
  title: 'DistortNewYork — Info / Submit',
  description: 'Share your thoughts, or promote a show / event',
  alternates: { canonical: '/contact' },
}

type Category =
  | 'community'
  | 'fund'
  | 'humanitarian'
  | 'antiwar'
  | 'legal'
  | 'indigenous'
  | 'press'

type Resource = {
  name: string
  description: string
  url: string
  cta: string
  category: Category
}

const CONTACT = {
  email: 'contact@distortnewyork.com',
  donateUrl: 'https://donate.stripe.com/5kA7wegxI9Bme4g289',
}

const CATEGORY_ORDER: Category[] = [
  'community',
  'humanitarian',
  'antiwar',
  'legal',
  'indigenous',
  'fund',
  'press',
]

const CATEGORY_LABEL: Record<Category, string> = {
  community: 'Community',
  fund: 'Mutual aid',
  humanitarian: 'Humanitarian',
  antiwar: 'Anti-war',
  legal: 'Know your rights',
  indigenous: 'Indigenous',
  press: 'Press',
}

const RESOURCES: Resource[] = [
  {
    name: 'Mayday Space',
    description: 'A home for movements, social justice activism, and community events in Brooklyn.',
    url: 'https://maydayspace.org/',
    cta: 'maydayspace.org',
    category: 'community',
  },
  {
    name: 'Save Project Reach',
    description: 'Raising funds to help empower young people and marginalized communities.',
    url: 'https://www.instagram.com/saveprojectreach/',
    cta: '@saveprojectreach',
    category: 'community',
  },
  {
    name: 'Atlanta Solidarity Fund',
    description:
      'Bails out activists arrested for participating in social justice movements and helps them access lawyers.',
    url: 'https://secure.actblue.com/donate/atlanta-solidarity-fund',
    cta: 'contribute',
    category: 'fund',
  },
  {
    name: 'Medical Aid for Palestinians',
    description: 'Urgent medical aid for Palestinians in Gaza, the West Bank, and refugee camps across the region.',
    url: 'https://linktr.ee/MedicalAidforPalestinians',
    cta: 'map.org.uk',
    category: 'humanitarian',
  },
  {
    name: 'UNRWA',
    description:
      'UN relief agency providing assistance, protection, and advocacy for Palestinian refugees across Gaza and the region.',
    url: 'https://www.unrwa.org/',
    cta: 'unrwa.org',
    category: 'humanitarian',
  },
  {
    name: "Palestine Children's Relief Fund",
    description:
      'Humanitarian medical relief for children in Palestine and the Middle East. Charity Navigator 4-star rated for 12+ years.',
    url: 'https://www.pcrf.net/',
    cta: 'pcrf.net',
    category: 'humanitarian',
  },
  {
    name: 'HEAL Palestine',
    description: '501(c)(3) delivering humanitarian, educational, and medical aid to Gaza.',
    url: 'https://www.healpalestine.org/',
    cta: 'healpalestine.org',
    category: 'humanitarian',
  },
  {
    name: "Middle East Children's Alliance",
    description: "Humanitarian aid, children's programs, and advocacy rooted in Palestine and the broader region.",
    url: 'https://www.mecaforpeace.org/',
    cta: 'mecaforpeace.org',
    category: 'humanitarian',
  },
  {
    name: 'Jewish Voice for Peace',
    description: 'Jewish anti-occupation organizing for Palestinian liberation and ending US complicity in apartheid.',
    url: 'https://www.jewishvoiceforpeace.org/',
    cta: 'jewishvoiceforpeace.org',
    category: 'community',
  },
  {
    name: 'CODEPINK',
    description: 'Grassroots anti-war organization opposing US militarism, sanctions, and foreign intervention.',
    url: 'https://www.codepink.org/',
    cta: 'codepink.org',
    category: 'antiwar',
  },
  {
    name: 'Quincy Institute',
    description: 'Foreign-policy think tank advocating for restraint, diplomacy, and an end to endless war.',
    url: 'https://quincyinst.org/',
    cta: 'quincyinst.org',
    category: 'antiwar',
  },
  {
    name: 'Immigrant Defense Project',
    description:
      'Community defense, legal resources, and trainings to help people defend their rights against ICE and in immigration proceedings.',
    url: 'https://www.immigrantdefenseproject.org/',
    cta: 'immigrantdefenseproject.org',
    category: 'legal',
  },
  {
    name: 'National Immigration Law Center',
    description: 'Defends and advances the rights of low-income immigrants through policy, litigation, and organizing.',
    url: 'https://www.nilc.org/',
    cta: 'nilc.org',
    category: 'legal',
  },
  {
    name: 'CHIRLA',
    description:
      'Coalition for Humane Immigrant Rights — deportation defense, know-your-rights education, and community organizing.',
    url: 'https://www.chirla.org/',
    cta: 'chirla.org',
    category: 'legal',
  },
  {
    name: 'RAICES',
    description: 'Free and low-cost legal services for immigrants, refugees, and asylum seekers across Texas and beyond.',
    url: 'https://www.raicestexas.org/',
    cta: 'raicestexas.org',
    category: 'legal',
  },
  {
    name: 'NDN Collective',
    description:
      'Indigenous-led organization building Indigenous power through organizing, advocacy, philanthropy, and movement-building. Home of the LANDBACK campaign.',
    url: 'https://ndncollective.org/',
    cta: 'ndncollective.org',
    category: 'indigenous',
  },
  {
    name: 'Native American Rights Fund',
    description:
      'Nonprofit law firm dedicated to defending the rights of Native American tribes, organizations, and individuals nationwide.',
    url: 'https://narf.org/',
    cta: 'narf.org',
    category: 'indigenous',
  },
  {
    name: 'First Nations Development Institute',
    description:
      'Native-led nonprofit strengthening Native American economies and communities through grantmaking, advocacy, and technical assistance.',
    url: 'https://www.firstnations.org/',
    cta: 'firstnations.org',
    category: 'indigenous',
  },
  {
    name: "Lakota People's Law Project",
    description:
      'Advocacy, legal action, and direct organizing to protect Lakota and Indigenous rights — from MMIW to treaty rights to sacred lands.',
    url: 'https://www.lakotalaw.org/',
    cta: 'lakotalaw.org',
    category: 'indigenous',
  },
  {
    name: 'Democracy Now!',
    description: 'Independent daily news program — war and peace, environment, and social justice movements worldwide.',
    url: 'https://www.democracynow.org/',
    cta: 'democracynow.org',
    category: 'press',
  },
  {
    name: 'The Intercept',
    description: 'Investigative, adversarial journalism holding the powerful accountable.',
    url: 'https://theintercept.com/',
    cta: 'theintercept.com',
    category: 'press',
  },
  {
    name: 'Mondoweiss',
    description: 'News and analysis covering Palestine, Israel, and the broader movement for justice.',
    url: 'https://mondoweiss.net/',
    cta: 'mondoweiss.net',
    category: 'press',
  },
  {
    name: 'The Electronic Intifada',
    description: 'Palestinian-led publication reporting on the struggle for Palestinian freedom and equality.',
    url: 'https://electronicintifada.net/',
    cta: 'electronicintifada.net',
    category: 'press',
  },
  {
    name: 'Jacobin',
    description: 'Leading voice on the American left — politics, economics, and culture from a socialist perspective.',
    url: 'https://jacobin.com/',
    cta: 'jacobin.com',
    category: 'press',
  },
]

interface ContactPageProps {
  searchParams: Promise<{ cat?: string }>
}

function isCategory(value: string | undefined): value is Category {
  return CATEGORY_ORDER.includes(value as Category)
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { cat } = await searchParams
  const activeCategory: Category | '' = isCategory(cat) ? cat : ''

  const filtered = activeCategory
    ? RESOURCES.filter((r) => r.category === activeCategory)
    : RESOURCES

  const filterOptions = CATEGORY_ORDER.map((c) => ({
    value: c,
    label: CATEGORY_LABEL[c],
    count: RESOURCES.filter((r) => r.category === c).length,
  })).filter((o) => o.count > 0)

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
          active={activeCategory}
          totalCount={RESOURCES.length}
        />
        <ul className={classes.grid}>
          {filtered.map((r) => (
            <li key={r.name}>
              <Link
                className={classes.card}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className={classes.cardBody}>
                  <span className={classes.category}>{CATEGORY_LABEL[r.category]}</span>
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
