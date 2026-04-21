import Link from 'next/link'
import type { ResourceWithCategory } from '@/lib/resources'
import DeleteResourceButton from './delete-resource-button'
import classes from './show-table.module.css'

type Props = { items: ResourceWithCategory[] }

export default function ResourcesTable({ items }: Props) {
  if (items.length === 0) {
    return <p className={classes.empty}>No resources yet.</p>
  }
  return (
    <div className={classes.wrap}>
      <table className={classes.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>CTA</th>
            <th>Sort</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td className={classes.title}>
                <Link href={`/admin/resources/${r.id}`} className={classes.titleLink}>
                  {r.name}
                </Link>
              </td>
              <td className={classes.clampCell} data-label="Category">
                <div className={classes.clamp}>{r.category.name}</div>
              </td>
              <td className={classes.clampCell} data-label="CTA">
                <div className={classes.clamp}>{r.cta}</div>
              </td>
              <td className={`${classes.num} ${classes.mobileHide}`} data-label="Sort">{r.sortOrder}</td>
              <td className={classes.actionsCell}>
                <div className={classes.actions}>
                  <Link href={`/admin/resources/${r.id}`} className={classes.openBtn}>Edit</Link>
                  <DeleteResourceButton id={r.id} name={r.name} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
