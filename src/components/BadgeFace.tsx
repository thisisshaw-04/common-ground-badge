import { useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { type BorderId, type FootVideoId } from '../lib/badge'
import { BadgeOuterFrame, doodlePath, outerShellClass } from './BadgeFrame'
import { FootVideoFrame } from './FootVideoFrame'

interface BadgeFaceProps {
  width: number
  footVideo: FootVideoId
  border?: BorderId
  /** White composition area (name, draw canvas). */
  body: ReactNode
  /** Full-card layer (stickers) — positioned over lockup, body, and foot. */
  overlay?: ReactNode
  bodyHeight: number
  footHeight: number
  badgeRef?: RefObject<HTMLDivElement | null>
  className?: string
}

const LOCKUP_SRC = `${import.meta.env.BASE_URL}common-ground-lockup.png`

/**
 * Badge face with the Common Ground lockup image flush to the top,
 * interactive body, framed foot video, and selectable outer frame.
 */
export function BadgeFace({
  width,
  footVideo,
  border = 'none',
  body,
  overlay,
  bodyHeight,
  footHeight,
  badgeRef,
  className = '',
}: BadgeFaceProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const clipId = `wiggle-${useId().replace(/:/g, '')}`
  const wiggly = border === 'wiggly'
  const [size, setSize] = useState({ w: width, h: Math.round(width * 1.45) })

  const setNode = (node: HTMLDivElement | null) => {
    nodeRef.current = node
    if (badgeRef) badgeRef.current = node
  }

  useLayoutEffect(() => {
    const host = nodeRef.current
    if (!wiggly || !host) return
    const update = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(host)
    return () => ro.disconnect()
  }, [wiggly, width, bodyHeight, footHeight])

  const clipD = wiggly && size.w > 0 ? doodlePath(size.w, size.h, 7) : ''
  const clipStyle = clipD
    ? ({
        clipPath: `url(#${clipId})`,
        WebkitClipPath: `url(#${clipId})`,
      } as const)
    : undefined

  const face = (
    <>
      {/* Lockup image — flush to badge top */}
      <div className="poster-lockup relative z-10">
        <img
          src={LOCKUP_SRC}
          alt="Common Ground Makeathon"
          className="poster-lockup-img"
          draggable={false}
        />
      </div>

      {/* Interactive white field (name + draw) */}
      <div
        data-badge-body
        className="relative z-20 mx-4 overflow-hidden bg-white"
        style={{ height: bodyHeight }}
      >
        {body}
      </div>

      {/* Organic foot-video blob — 10px inset matches lockup */}
      <div className="badge-foot poster-foot relative z-30 px-[10px] pt-2 pb-3">
        <FootVideoFrame id={footVideo} height={footHeight} />
      </div>

      {/* Stickers — topmost layer over lockup, body, foot, frames, everything */}
      {overlay ? (
        <div
          data-badge-stickers
          className="pointer-events-none absolute inset-0 z-[100] overflow-hidden"
        >
          {overlay}
        </div>
      ) : null}
    </>
  )

  return (
    <div
      ref={setNode}
      data-badge-card
      className={`badge-shell badge-poster relative ${wiggly ? '' : 'bg-white shadow-[0_18px_40px_rgba(0,0,0,0.1)]'} ${outerShellClass(border)} ${className}`}
      style={{ width, maxWidth: '100%' }}
    >
      {clipD ? (
        <svg
          className="pointer-events-none absolute inset-0 z-0 h-full w-full"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          aria-hidden
        >
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <path d={clipD} />
            </clipPath>
          </defs>
          <path d={clipD} fill="#fff" />
        </svg>
      ) : null}

      <div className="relative z-[1] bg-white" style={clipStyle}>
        {face}
      </div>

      <BadgeOuterFrame border={border} width={size.w} height={size.h} path={clipD} />
    </div>
  )
}
