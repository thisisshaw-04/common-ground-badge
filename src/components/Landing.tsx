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
    <div className="page-fig relative flex min-h-dvh flex-col">
      <main className="relative z-20 mx-auto flex w-full max-w-[1120px] flex-col items-center px-5 pt-6 pb-28 md:min-h-0 md:flex-1 md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 md:pb-24 lg:gap-16">
        <div className="animate-floaty flex shrink-0 -translate-y-2 scale-[0.72] flex-col items-center sm:scale-90 md:-translate-y-4 md:scale-100">
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

        <div className="animate-pop mt-4 flex max-w-lg flex-col items-center gap-5 text-center md:mt-0">
          <div className="flex flex-col items-center gap-2">
            <p className="text-[clamp(2rem,5vw,4.1rem)] leading-none tracking-[-0.04em] text-black">
              Welcome to
            </p>
            <div className="flex items-center justify-center">
              <span className="hero-mark px-2.5 py-1.5 sm:px-4 sm:py-3 lg:px-5 lg:py-4">
                Common
              </span>
              <span className="hero-mark rounded-full px-2.5 py-1.5 sm:px-4 sm:py-3 lg:px-5 lg:py-4">
                Ground
              </span>
            </div>
          </div>
          <p className="max-w-[16rem] text-[clamp(1.2rem,2.5vw,2.25rem)] leading-snug text-black sm:max-w-[20rem] lg:max-w-[24rem]">
            Start your journey with a Common Ground Badge!
          </p>
          <button
            type="button"
            onClick={onStart}
            className="cta-blue w-full max-w-[18.75rem] px-5 py-3.5 text-lg sm:max-w-[20rem] sm:text-[21px]"
          >
            Build a Common Ground Badge
          </button>
        </div>
      </main>

      <DecoCorners />

      <footer className="relative z-30 px-4 py-4 text-center md:absolute md:inset-x-0 md:bottom-4 md:py-0">
        <p className="text-[12px] text-black/40">
          {EVENT.subtitle} · Design × Tech × Culture · {EVENT.date} {EVENT.year}
        </p>
      </footer>
    </div>
  )
}
