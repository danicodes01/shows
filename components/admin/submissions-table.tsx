import Link from 'next/link'
import type { ContactModel as Contact } from '@/lib/generated/prisma/models'
import DeleteSubmissionButton from './delete-submission-button'
import classes from './show-table.module.css'

export type SubmissionsSort = 'newest' | 'oldest'

type Props = { items: Contact[]; sort: SubmissionsSort }

const dateFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: 'short',
  day: '2-digit',
})

export default function SubmissionsTable({ items, sort }: Props) {
  if (items.length === 0) {
    return <p className={classes.empty}>No submissions yet.</p>
  }
  const nextSort: SubmissionsSort = sort === 'newest' ? 'oldest' : 'newest'
  const arrow = sort === 'newest' ? '↓' : '↑'
  return (
    <div className={classes.wrap}>
      <table className={classes.table}>
        <thead>
          <tr>
            <th aria-label="Image"></th>
            <th>Title</th>
            <th>Venue</th>
            <th>Date</th>
            <th>Submitter</th>
            <th>
              <Link href={`/admin/submissions?sort=${nextSort}`} className={classes.sortBtn} scroll={false}>
                Received <span className={classes.sortArrow} aria-hidden="true">{arrow}</span>
              </Link>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id}>
              <td className={classes.thumbCell}>
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.imageUrl} alt="" className={classes.thumb} loading="lazy" />
                ) : (
                  <div className={classes.thumbEmpty} aria-hidden="true">—</div>
                )}
              </td>
              <td className={classes.title}>
                <Link href={`/admin/submissions/${s.id}`} className={classes.titleLink}>
                  {s.title || '(untitled)'}
                </Link>
              </td>
              <td className={classes.clampCell} data-label="Venue">
                <div className={classes.clamp}>{s.venue || '—'}</div>
              </td>
              <td className={classes.clampCell} data-label="Date">
                <div className={classes.clamp}>{s.date || '—'}</div>
              </td>
              <td className={classes.clampCell} data-label="Submitter">
                <div className={classes.clamp}>{s.email || '—'}</div>
              </td>
              <td className={`${classes.num} ${classes.mobileHide}`}>{dateFmt.format(s.createdAt)}</td>
              <td className={classes.actionsCell}>
                <div className={classes.actions}>
                  <Link href={`/admin/submissions/${s.id}`} className={classes.openBtn}>Review</Link>
                  <DeleteSubmissionButton id={s.id} title={s.title || '(untitled)'} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
