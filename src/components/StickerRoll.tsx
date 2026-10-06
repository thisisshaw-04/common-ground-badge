import type { PointerEvent as ReactPointerEvent } from 'react'
import type { StickerDef } from '../lib/badge'
import { StickerFace } from './StickerFace'

interface StickerRollProps {
  stickers: StickerDef[]
  peelingId?: string | null
  onPeelStart: (def: StickerDef, e: ReactPointerEvent<HTMLButtonElement>) => void
}

/** Horizontal tape-roll tray — peel a sticker and drag it onto the badge. */
export function StickerRoll({ stickers, peelingId = null, onPeelStart }: StickerRollProps) {
  return (
    <div className="sticker-roll" aria-label="Sticker tape roll">
      <div className="sticker-roll-core" aria-hidden>
        <span className="sticker-roll-hole" />
      </div>
      <div className="sticker-roll-strip">
        <div className="sticker-roll-perforation" aria-hidden />
        <div className="sticker-roll-track">
          {stickers.map((s, i) => {
            const peeling = peelingId === s.id
            return (
              <button
                key={s.id}
                type="button"
                className={`sticker-roll-item${peeling ? ' is-peeling' : ''}`}
                style={{ ['--peel-i' as string]: i }}
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
        <div className="sticker-roll-perforation sticker-roll-perforation-end" aria-hidden />
      </div>
      <div className="sticker-roll-core sticker-roll-core-end" aria-hidden>
        <span className="sticker-roll-hole" />
      </div>
    </div>
  )
}
