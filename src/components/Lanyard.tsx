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

/** Photoreal braided-rope lanyard + metal clasp (generated product stills). */
export function Lanyard({ cord, scale = 1 }: LanyardProps) {
  const w = 200 * scale
  const h = 150 * scale

  return (
    <div
      className="relative flex flex-col items-center justify-end"
      style={{ width: w, height: h }}
    >
      <img
        src={LANYARD_SRC[cord]}
        alt=""
        draggable={false}
        className="pointer-events-none h-full w-full object-contain object-bottom select-none drop-shadow-[0_10px_18px_rgba(0,0,0,0.18)]"
      />
    </div>
  )
}

/** Compact cord swatch for the picker — mini rope photo. */
export function CordSwatch({ cord }: { cord: CordId }) {
  return (
    <span className="relative block h-10 w-8 overflow-hidden rounded-md bg-[#f3f3f3] ring-1 ring-black/5">
      <img
        src={LANYARD_SRC[cord]}
        alt=""
        draggable={false}
        className="absolute inset-0 h-[140%] w-full object-cover object-top"
      />
    </span>
  )
}
