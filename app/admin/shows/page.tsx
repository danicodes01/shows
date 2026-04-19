import type { Metadata } from 'next'
import { getAllVenues, getShowsForAdmin, ADMIN_SHOWS_PER_PAGE } from '@/lib/shows'
import {
  parseAdminShowsParams,
  type AdminShowsSearchParams,
} from '@/lib/admin/show-filters'
import FilterPanel from '@/components/admin/filter-panel'
import ShowTable from '@/components/admin/show-table'
import AdminPagination from '@/components/admin/pagination'
import classes from './shows.module.css'

export const metadata: Metadata = {
  title: 'Admin — Shows',
  robots: { index: false, follow: false },
}

type Props = { searchParams: Promise<AdminShowsSearchParams> }

export default async function AdminShowsPage({ searchParams }: Props) {
  const sp = await searchParams
  const { filters, page } = parseAdminShowsParams(sp)

  const [{ items, total }, venues] = await Promise.all([
    getShowsForAdmin(filters, { page }),
    getAllVenues(),
  ])

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_SHOWS_PER_PAGE))
  const currentSearch = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) {
    if (v == null) continue
    if (Array.isArray(v)) v.forEach(x => currentSearch.append(k, x))
    else currentSearch.set(k, v)
  }

  return (
    <section className={classes.page}>
      <header className={classes.header}>
        <h1 className={classes.title}>Shows</h1>
        <p className={classes.count}>
          {total.toLocaleString()} result{total === 1 ? '' : 's'}
        </p>
      </header>

      <div className={classes.layout}>
        <FilterPanel venues={venues} />
        <div className={classes.results}>
          <ShowTable items={items} />
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/admin/shows"
            searchParams={currentSearch}
          />
        </div>
      </div>
    </section>
  )
}
