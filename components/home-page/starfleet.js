import classes from './starfleet.module.css'
import Link from 'next/link'

function Starfleet () {
  return (
    <section className={classes.Starfleet}>
      <Link
        href='http://starfleetgame.s3-website-us-east-1.amazonaws.com'
        target='_blank'
        rel='noopener noreferrer'
        >
        <h3>Play starfleet!🛸</h3>
      </Link>
    </section>
  )
}

export default Starfleet
