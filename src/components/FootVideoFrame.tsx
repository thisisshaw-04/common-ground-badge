import { useId } from 'react'
import type { FootVideoId } from '../lib/badge'
import { FootVideo } from './FootVideo'

/** Matches the provided outline asset aspect (~853×568). */
export const FOOT_FRAME_VB = { w: 400, h: 266 } as const

const OUTLINE_SRC = `${import.meta.env.BASE_URL}foot-frame-outline.png`

/**
 * Clip path traced from the outline asset — soft TR dip, matching BL,
 * rounded TL/BR. viewBox 0 0 400 266.
 */
export const FOOT_FRAME_PATH =
  'M 4 133 ' +
  'V 28 ' +
  'C 4 12 12 2 28 2 ' +
  'H 252 ' +
  'C 278 2 300 8 322 18 ' +
  'C 344 28 360 30 374 30 ' +
  'C 388 30 396 38 396 54 ' +
  'V 212 ' +
  'C 396 228 390 244 374 252 ' +
  'C 366 260 356 264 340 264 ' +
  'H 148 ' +
  'C 122 264 98 258 76 250 ' +
  'C 54 242 36 242 22 242 ' +
  'C 10 242 4 234 4 218 ' +
  'V 133 ' +
  'Z'

interface FootVideoFrameProps {
  id: FootVideoId
  height: number
}

export function FootVideoFrame({ id, height }: FootVideoFrameProps) {
  const uid = useId().replace(/:/g, '')
  const clipId = `foot-clip-${id}-${uid}`
  const { w, h } = FOOT_FRAME_VB

  return (
    <div className="foot-frame relative w-full" style={{ height }}>
      {/* Video clipped to the outline shape */}
      <div className="foot-frame-media absolute inset-0">
        <svg className="absolute h-0 w-0" aria-hidden>
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path
                d={FOOT_FRAME_PATH}
                transform={`scale(${1 / w}, ${1 / h})`}
              />
            </clipPath>
          </defs>
        </svg>
        <div
          className="foot-frame-clip h-full w-full bg-[#c8c8c8]"
          style={{ clipPath: `url(#${clipId})` }}
        >
          <FootVideo id={id} className="h-full w-full object-cover" />
        </div>
      </div>

      {/* Exact outline stroke from the provided asset */}
      <img
        src={OUTLINE_SRC}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-fill select-none"
      />
    </div>
  )
}
