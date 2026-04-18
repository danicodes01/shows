import Link from 'next/link'
import classes from './donate.module.css'

export default function Donate() {
  return (
    <section className={classes.donate}>
      <h2>Donate today - help us provide urgent supplies to Palestinians in need</h2>
      <Link
        href="https://linktr.ee/MedicalAidforPalestinians"
        target="_blank"
        rel="noopener noreferrer"
      >
        https://www.map.org.uk/donate/donate
      </Link>
      <hr />
    </section>
  )
}
