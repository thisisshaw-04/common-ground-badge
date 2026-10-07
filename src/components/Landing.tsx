import { DEMO_STATE, EVENT, stickerById } from '../lib/badge'
import { BadgeFace } from './BadgeFace'
import { DecoCorners } from './DecoCorners'
import { Lanyard } from './Lanyard'
import { StickerFace } from './StickerFace'

interface LandingProps {
  onStart: () => void
}

const BADGE_W = 380
const BODY_H = 158
const FOOT_H = 208

export function Landing({ onStart }: LandingProps) {
  const demo = DEMO_STATE

  return (
    <div className="page-fig relative flex h-dvh flex-col overflow-hidden">
      <main className="relative z-20 mx-auto flex min-h-0 w-full max-w-[1120px] flex-1 flex-col items-center px-5 pt-6 pb-24 md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 lg:gap-16">
        <div className="animate-floaty flex shrink-0 -translate-y-2 scale-[0.88] flex-col items-center sm:scale-95 md:-translate-y-4 md:scale-100">
          <Lanyard cord={demo.cord} scale={0.58} />
          <BadgeFace
            width={BADGE_W}
            footVideo={demo.footVideo}
            border={demo.border}
            bodyHeight={BODY_H}
            footHeight={FOOT_H}
            className="-mt-9"
            body={
              <p className="poster-name-input absolute top-2 left-1/2 z-10 w-[84%] -translate-x-1/2 text-center text-[1.65rem] font-extrabold tracking-[-0.03em] text-black uppercase">
                {demo.name}
              </p>
            }
            overlay={demo.stickers.map((s) => {
              const def = stickerById(s.defId)
              if (!def) return null
              return (
                <span
                  key={s.uid}
                  className="sticker-on-badge pointer-events-none absolute"
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
          />
        </div>

        <div className="animate-pop mt-2 max-w-md text-center md:mt-0 md:text-left">
          <p className="text-lg text-black/70 md:text-xl">Welcome to</p>
          <div className="mt-3 flex flex-nowrap items-center justify-center gap-2 md:justify-start">
            <span className="poster-box poster-box-common text-[clamp(1.25rem,3vw,1.85rem)]">
              Common
            </span>
            <span className="poster-box poster-box-ground text-[clamp(1.25rem,3vw,1.85rem)] !ml-0">
              Ground
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
