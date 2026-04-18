import Link from 'next/link'
import classes from './starfleet.module.css'

export default function Starfleet() {
  return (
    <section className={classes.starfleet}>
      <Link
        href="http://starfleetgame.s3-website-us-east-1.amazonaws.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <h3>Play Starfleet! 🛸</h3>
      </Link>
    </section>
  )
}
