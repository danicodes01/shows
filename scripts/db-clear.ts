import '../scrapers/lib/env'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function usage(): never {
  console.error(`Usage:
  npm run db:clear -- <venue-slug>              delete all shows for a venue
  npm run db:clear -- <venue-slug> --with-venue delete shows + venue
  npm run db:clear -- --all                     delete ALL shows and ALL venues`)
  process.exit(1)
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) usage()

  if (args.includes('--all')) {
    const shows = await sql`DELETE FROM "Show"` as unknown as { rowCount: number }
    const venues = await sql`DELETE FROM "Venue"` as unknown as { rowCount: number }
    console.log(`✓ Deleted ${shows.rowCount ?? 0} shows and ${venues.rowCount ?? 0} venues`)
    return
  }

  const slug = args.find((a) => !a.startsWith('--'))
  if (!slug) usage()

  const venues = (await sql`SELECT id, name FROM "Venue" WHERE slug = ${slug}`) as Array<{ id: string; name: string }>
  if (venues.length === 0) {
    console.error(`✗ No venue found with slug "${slug}"`)
    process.exit(1)
  }
  const venue = venues[0]

  const shows = (await sql`DELETE FROM "Show" WHERE "venueId" = ${venue.id}`) as unknown as { rowCount: number }
  console.log(`✓ Deleted ${shows.rowCount ?? 0} shows for "${venue.name}"`)

  if (args.includes('--with-venue')) {
    await sql`DELETE FROM "Venue" WHERE id = ${venue.id}`
    console.log(`✓ Deleted venue "${venue.name}"`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
