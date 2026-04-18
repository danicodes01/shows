import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="center">
      <h2>Page Not Found</h2>
      <p>Could not find the requested page.</p>
      <Link href="/">Back to Home</Link>
    </div>
  )
}
