import type { CordId } from '../lib/badge'

const LANYARD_SRC: Record<CordId, string> = {
  signal: `${import.meta.env.BASE_URL}lanyards/signal.png`,
  flare: `${import.meta.env.BASE_URL}lanyards/flare.png`,
  acid: `${import.meta.env.BASE_URL}lanyards/acid.png`,
}

interface LanyardProps {
  cord: CordId
  scale?: number
}

/**
 * Braided rope cutout — straps bleed off the top so it reads as
 * attached hardware, not a floating product photo.
 */
export function Lanyard({ cord, scale = 1 }: LanyardProps) {
  const w = 220 * scale
  const h = 128 * scale

  return (
    <div
      className="pointer-events-none relative overflow-hidden"
      style={{ width: w, height: h }}
      aria-hidden
    >
      <img
        src={LANYARD_SRC[cord]}
        alt=""
        draggable={false}
        className="absolute inset-x-0 -top-[18%] mx-auto h-[128%] w-[92%] max-w-none object-contain object-bottom select-none"
        style={{
          filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.16))',
        }}
      />
    </div>
  )
}

/** Compact cord swatch — strap texture crop, not full product shot. */
export function CordSwatch({ cord }: { cord: CordId }) {
  return (
    <span className="relative block h-11 w-9 overflow-hidden rounded-lg bg-transparent">
      <img
        src={LANYARD_SRC[cord]}
        alt=""
        draggable={false}
        className="absolute top-[-10%] left-1/2 h-[160%] w-[220%] max-w-none -translate-x-1/2 object-cover object-[50%_35%] select-none"
      />
    </span>
  )
}
