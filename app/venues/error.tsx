'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="center">
      <p>Something went wrong loading venues.</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
