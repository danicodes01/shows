import Link from 'next/link'
import classes from './pagination.module.css'

type Props = {
  currentPage: number
  totalPages: number
  basePath: string
  searchParams: URLSearchParams
}

function pageList(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | 'ellipsis')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('ellipsis')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('ellipsis')
  pages.push(total)
  return pages
}

export default function AdminPagination({
  currentPage,
  totalPages,
  basePath,
  searchParams,
}: Props) {
  if (totalPages <= 1) return null

  function hrefFor(page: number): string {
    const next = new URLSearchParams(searchParams)
    if (page === 1) next.delete('page')
    else next.set('page', String(page))
    const qs = next.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const pages = pageList(currentPage, totalPages)
  const prevPage = Math.max(1, currentPage - 1)
  const nextPage = Math.min(totalPages, currentPage + 1)

  return (
    <nav className={classes.pagination} aria-label="Pagination">
      <Link
        href={hrefFor(prevPage)}
        className={classes.nav}
        aria-label="Previous page"
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : undefined}
      >
        ‹
      </Link>
      <ul className={classes.pages}>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <li key={`e${i}`} className={classes.ellipsis} aria-hidden>…</li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                className={p === currentPage ? classes.active : classes.page}
                aria-current={p === currentPage ? 'page' : undefined}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ul>
      <Link
        href={hrefFor(nextPage)}
        className={classes.nav}
        aria-label="Next page"
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : undefined}
      >
        ›
      </Link>
    </nav>
  )
}
