import { useId } from 'react'
import type { FootVideoId } from '../lib/badge'
import { FootVideo } from './FootVideo'

/** Viewbox of the supplied frame outline (public/foot-frame-outline.png). */
export const FOOT_FRAME_VB = { w: 853, h: 568 } as const

/**
 * Stroke centreline of the supplied frame outline, traced with
 * `node scripts/trace-foot-frame.mjs`. Clip and border share this path.
 */
export const FOOT_FRAME_PATH =
  'M 1 284 L 1.1 38.4 L 1.8 31.4 L 3.8 24.9 L 5.8 21.1 L 8 17.4 L 12.2 12.4 L 19.1 6.6 L 23.5 4.5 L 28.4 2.7 L 34 1.5 L 40.5 1 L 406.7 0.9 L 554 1 L 568.8 1.7 L 582.2 3.1 L 598.5 6.1 L 617.4 11.4 L 714.9 44.1 L 732.8 49 L 746.1 51.8 L 753.7 52.8 L 767.7 53.9 L 812.7 54.2 L 822.2 55.5 L 827.1 57.4 L 833.8 60.5 L 838.8 64.8 L 841.7 67.9 L 845.3 72.9 L 848.2 78.3 L 850.1 84.2 L 851 92.8 L 851 284 L 851 521.7 L 850.9 529 L 850.3 533.6 L 848.8 540.2 L 848 542.3 L 844.9 548 L 840.7 553 L 837.6 556.1 L 832.1 560.2 L 827.9 562.5 L 820.1 564.8 L 810.6 565.6 L 803.7 565.7 L 301.2 565.5 L 278.6 565.1 L 266.5 563.9 L 254.5 562 L 248.5 560.7 L 236.6 557.8 L 132.8 530.4 L 113.5 526.3 L 95.9 524.2 L 90.1 523.9 L 81 523.7 L 35.2 523.8 L 28.5 523.2 L 22.5 522 L 19.9 521.1 L 15.6 518.9 L 11.9 516.2 L 8.8 513.2 L 6.1 509.9 L 3.1 504.4 L 1.5 498.2 L 1 493.8 Z'

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
      {/* objectBoundingBox clip so the shape stretches with the video box */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={FOOT_FRAME_PATH} transform={`scale(${1 / w} ${1 / h})`} />
          </clipPath>
        </defs>
      </svg>

      <div
        className="foot-frame-media absolute inset-0 bg-[#1a1a1a]"
        style={{ clipPath: `url(#${clipId})`, WebkitClipPath: `url(#${clipId})` }}
      >
        <FootVideo id={id} className="h-full w-full object-cover" />
      </div>

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={FOOT_FRAME_PATH}
          fill="none"
          stroke="#111"
          strokeWidth="2.25"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
