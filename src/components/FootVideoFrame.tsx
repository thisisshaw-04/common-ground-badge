import type { FootVideoId } from '../lib/badge'
import { FootVideo } from './FootVideo'

const MASK_SRC = `${import.meta.env.BASE_URL}foot-frame-mask.png`

interface FootVideoFrameProps {
  id: FootVideoId
  height: number
}

/**
 * Video masked to the brand silhouette. Outline is a drop-shadow of that
 * same mask — one alpha shape, so fill and stroke can never leave a gap.
 */
export function FootVideoFrame({ id, height }: FootVideoFrameProps) {
  return (
    <div
      className="foot-frame relative w-full"
      style={{
        height,
        filter:
          'drop-shadow(0 0 0.7px #111) drop-shadow(0 0 0.7px #111) drop-shadow(0 0 0.7px #111)',
      }}
    >
      <div
        className="foot-frame-media absolute inset-0"
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
    </div>
  )
}
