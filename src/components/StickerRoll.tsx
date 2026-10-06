import type { PointerEvent as ReactPointerEvent } from 'react'
import type { StickerDef } from '../lib/badge'
import { StickerFace } from './StickerFace'

interface StickerRollProps {
  stickers: StickerDef[]
  peelingId?: string | null
  onPeelStart: (def: StickerDef, e: ReactPointerEvent<HTMLButtonElement>) => void
}

/**
 * White sticker tape that unrolls leftward off a roll at the bottom-right.
 * Remount (e.g. `key={tab}`) to replay the unroll.
 */
export function StickerRoll({ stickers, peelingId = null, onPeelStart }: StickerRollProps) {
  return (
    <div className="tape-stage" aria-label="Sticker tape">
      <div className="tape">
        <div className="tape-strip">
          <div className="tape-track">
            {stickers.map((s, i) => {
              const peeling = peelingId === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`tape-item${peeling ? ' is-peeling' : ''}`}
                  style={{ ['--i' as string]: i }}
                  aria-label={`Peel ${s.label} sticker`}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onPeelStart(s, e)
                  }}
                >
                  <StickerFace def={s} large />
                </button>
              )
            })}
          </div>
        </div>
        <span className="tape-curl-shine" aria-hidden />
        <span className="tape-roll" aria-hidden>
          <span className="tape-roll-hole" />
        </span>
      </div>
    </div>
  )
}
