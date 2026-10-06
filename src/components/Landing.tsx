import { DEMO_STATE, EVENT, stickerById } from '../lib/badge'
import { DecoCorners } from './DecoCorners'
import { FootVideo } from './FootVideo'
import { Lanyard } from './Lanyard'
import { StickerFace } from './StickerFace'

interface LandingProps {
  onStart: () => void
}

const BADGE_W = 300
const BODY_H = 280

export function Landing({ onStart }: LandingProps) {
  const demo = DEMO_STATE

  return (
    <div className="page-fig relative flex h-dvh flex-col overflow-hidden">
      <main className="relative z-20 mx-auto flex min-h-0 w-full max-w-[1120px] flex-1 flex-col items-center px-5 pt-6 pb-24 md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 lg:gap-16">
        {/* Badge preview — left */}
        <div className="animate-floaty flex shrink-0 scale-[0.82] flex-col items-center sm:scale-90 md:scale-100">
          <Lanyard cord={demo.cord} scale={1.15} />
          <div
            className="relative -mt-12 overflow-hidden border-2 border-black bg-white shadow-[0_18px_40px_rgba(0,0,0,0.1)]"
            style={{ width: BADGE_W }}
          >
            <div className="flex items-center justify-center gap-2 px-3 pt-4 pb-2">
              <span className="brand-chip brand-chip-rect text-[15px] tracking-tight uppercase">
                Common Ground
              </span>
              <span className="brand-chip brand-chip-pill text-[15px]">{EVENT.year}</span>
            </div>

            <div
              className="relative mx-3 overflow-hidden bg-white"
              style={{ height: BODY_H }}
            >
              <p className="font-hand absolute top-6 left-1/2 z-10 w-[88%] -translate-x-1/2 text-center text-5xl text-black">
                {demo.name}
              </p>
              {demo.stickers.map((s) => {
                const def = stickerById(s.defId)
                if (!def) return null
                return (
                  <span
                    key={s.uid}
                    className="absolute z-20"
                    style={{
                      left: `${s.x}%`,
                      top: `${s.y}%`,
                      transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
                    }}
                  >
                    <StickerFace def={def} compact />
                  </span>
                )
              })}
            </div>

            <div className="badge-foot relative mx-0 h-[150px] overflow-hidden bg-[#d8d8d8]">
              <FootVideo id={demo.footVideo} />
            </div>
          </div>
        </div>

        {/* Hero copy — right */}
        <div className="animate-pop mt-2 max-w-md text-center md:mt-0 md:text-left">
          <p className="text-lg text-black/70 md:text-xl">Welcome to</p>
          <div className="mt-3 flex flex-nowrap items-center justify-center gap-2 md:justify-start">
            <span className="brand-chip brand-chip-rect text-[clamp(1.25rem,3vw,1.85rem)] tracking-tight uppercase">
              Common&nbsp;Ground
            </span>
            <span className="brand-chip brand-chip-pill text-[clamp(1.25rem,3vw,1.85rem)]">
              {EVENT.year}
            </span>
          </div>
          <p className="mt-5 text-lg text-black/80 md:text-xl">
            Start your journey with a Common Ground Badge!
          </p>
          <button
            type="button"
            onClick={onStart}
            className="cta-blue mt-8 w-full max-w-sm px-6 py-4 text-base md:w-auto md:text-lg"
          >
            Build a Common Ground Badge
          </button>
          <p className="mt-4 font-mono text-[11px] tracking-wide text-black/40 uppercase">
            {EVENT.date} · {EVENT.place}
          </p>
        </div>
      </main>

      <DecoCorners />

      <footer className="absolute inset-x-0 bottom-3 z-30 px-4 text-center">
        <p className="text-[12px] text-black/35">
          {EVENT.subtitle} · Design × Tech × Culture · {EVENT.date} {EVENT.year}
        </p>
      </footer>
    </div>
  )
}
