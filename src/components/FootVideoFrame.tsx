import { useId } from 'react'
import type { FootVideoId } from '../lib/badge'
import { FootVideo } from './FootVideo'

/** Matches foot-frame-outline.png aspect (~853×568). */
export const FOOT_FRAME_VB = { w: 853, h: 568 } as const

/**
 * Soft brand frame path — rounded corners, soft TR dip, soft BL scoop.
 * Clip, underfill, and stroke all share this path.
 */
export const FOOT_FRAME_PATH =
  'M 36 8 ' +
  'H 555 ' +
  'C 615 8 675 16 735 44 ' +
  'C 775 58 815 58 828 58 ' +
  'C 842 58 845 68 845 88 ' +
  'V 492 ' +
  'C 845 524 832 552 800 560 ' +
  'H 290 ' +
  'C 210 560 145 548 95 528 ' +
  'C 55 512 28 512 20 512 ' +
  'C 8 512 8 496 8 476 ' +
  'V 80 ' +
  'C 8 36 16 8 36 8 ' +
  'Z'

interface FootVideoFrameProps {
  id: FootVideoId
  height: number
}

export function FootVideoFrame({ id, height }: FootVideoFrameProps) {
  const uid = useId().replace(/:/g, '')
  const clipId = `foot-clip-${uid}`
  const { w, h } = FOOT_FRAME_VB

  return (
    <div className="foot-frame relative w-full" style={{ height }}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <clipPath id={clipId}>
            <path d={FOOT_FRAME_PATH} />
          </clipPath>
        </defs>

        {/* Solid underfill — same path, kills any white fringe */}
        <path d={FOOT_FRAME_PATH} fill="#1a1a1a" />

        {/* Video clipped to the same path */}
        <foreignObject
          x="0"
          y="0"
          width={w}
          height={h}
          clipPath={`url(#${clipId})`}
        >
          <div
            // @ts-expect-error HTML namespace inside SVG foreignObject
            xmlns="http://www.w3.org/1999/xhtml"
            style={{ width: '100%', height: '100%', margin: 0 }}
          >
            <FootVideo id={id} className="h-full w-full object-cover" />
          </div>
        </foreignObject>

        {/* Crisp border on the same path */}
        <path
          d={FOOT_FRAME_PATH}
          fill="none"
          stroke="#111"
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
