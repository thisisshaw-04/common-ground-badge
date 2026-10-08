import { CORDS, type CordId } from '../lib/badge'

const BASE = import.meta.env.BASE_URL || '/'

export function cordSrc(id: CordId) {
  return `${BASE}lanyards/${CORDS[id].file}`
}

export function cordSwatchSrc(id: CordId) {
  return `${BASE}lanyards/${CORDS[id].swatch}`
}

interface LanyardProps {
  cord: CordId
  scale?: number
  className?: string
}

/** Printed Y-lanyard PNG — fabric ends at the badge’s top edge. */
export function Lanyard({ cord, scale = 1, className = '' }: LanyardProps) {
  const width = Math.round(240 * scale)
  return (
    <div
      className={`lanyard-hang pointer-events-none ${className}`.trim()}
      style={{ width }}
      aria-hidden
    >
      <img
        key={cord}
        src={cordSrc(cord)}
        alt=""
        draggable={false}
        className="lanyard-hang-img"
      />
    </div>
  )
}

export function CordSwatch({ cord }: { cord: CordId }) {
  return (
    <img
      src={cordSwatchSrc(cord)}
      alt=""
      draggable={false}
      className="cord-swatch"
    />
  )
}
