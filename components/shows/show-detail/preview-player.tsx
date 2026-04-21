'use client'

import { useEffect, useRef, useState } from 'react'
import classes from './preview-player.module.css'

export default function PreviewPlayer({
  src,
  trackTitle,
}: {
  src: string
  trackTitle?: string
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnd = () => setPlaying(false)
    const onPause = () => setPlaying(false)
    const onPlay = () => setPlaying(true)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('play', onPlay)
    return () => {
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('play', onPlay)
    }
  }, [])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => setPlaying(false))
    else audio.pause()
  }

  return (
    <div className={classes.player}>
      <button
        type="button"
        onClick={toggle}
        className={classes.button}
        aria-label={playing ? 'Pause preview' : 'Play preview'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M8 5l12 7-12 7z" fill="currentColor" />
          </svg>
        )}
      </button>
      <div className={classes.meta}>
        <span className={classes.label}>Top track</span>
        {trackTitle && <span className={classes.title}>{trackTitle}</span>}
      </div>
      <audio ref={audioRef} src={src} preload="none" />
    </div>
  )
}
