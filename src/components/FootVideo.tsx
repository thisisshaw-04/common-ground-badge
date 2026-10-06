import { useEffect, useRef } from 'react'
import { footVideoSrc, type FootVideoId } from '../lib/badge'

/** Autoplaying muted loop for the badge grey foot strip. */
export function FootVideo({
  id,
  className = '',
}: {
  id: FootVideoId
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const src = footVideoSrc(id)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.load()
    const play = () => {
      void v.play().catch(() => {
        /* autoplay may be blocked until gesture — muted should usually work */
      })
    }
    play()
    v.addEventListener('loadeddata', play)
    return () => v.removeEventListener('loadeddata', play)
  }, [src])

  return (
    <video
      ref={ref}
      key={src}
      className={`h-full w-full object-cover ${className}`}
      src={src}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-hidden
    />
  )
}
