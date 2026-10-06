import type { FootVideoId } from '../lib/badge'
import { FootVideo } from './FootVideo'

const OUTLINE_SRC = `${import.meta.env.BASE_URL}foot-frame-outline.png`
const MASK_SRC = `${import.meta.env.BASE_URL}foot-frame-mask.png`

interface FootVideoFrameProps {
  id: FootVideoId
  height: number
}

/**
 * Foot video clipped with a mask flooded from the outline asset,
 * then the same outline PNG stroked on top — no path/outline mismatch.
 */
export function FootVideoFrame({ id, height }: FootVideoFrameProps) {
  return (
    <div className="foot-frame relative w-full" style={{ height }}>
      <div
        className="foot-frame-media absolute inset-0 overflow-hidden bg-transparent"
        style={{
          WebkitMaskImage: `url(${MASK_SRC})`,
          maskImage: `url(${MASK_SRC})`,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      >
        <FootVideo id={id} className="h-full w-full object-cover" />
      </div>

      <img
        src={OUTLINE_SRC}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-fill select-none"
      />
    </div>
  )
}
