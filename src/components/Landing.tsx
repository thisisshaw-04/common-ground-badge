import { EVENT } from '../lib/badge'
import { FootVideoFrame } from './FootVideoFrame'

interface LandingProps {
  onStart: () => void
}

const BG = `${import.meta.env.BASE_URL}landing-scan.webp`
const CARD_H = 256

export function Landing({ onStart }: LandingProps) {
  return (
    <div className="landing-hero relative isolate min-h-dvh overflow-hidden">
      <img
        src={BG}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
      />

      <div className="relative z-10 grid min-h-dvh place-items-center px-4">
        <div className="landing-video-card animate-floaty">
          <FootVideoFrame id="signal" height={CARD_H} stroke="#d6e824" />
        </div>
      </div>

      <div className="landing-hero-dock pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-10">
        <button
          type="button"
          onClick={onStart}
          className="cta-blue pointer-events-auto w-full max-w-[18.75rem] px-5 py-3.5 text-lg sm:max-w-[20rem] sm:text-[21px]"
        >
          Build a Common Ground Badge
        </button>
        <p className="landing-hero-meta pointer-events-auto text-center text-[11px] tracking-[0.04em]">
          {EVENT.subtitle} · Design × Tech × Culture · {EVENT.date} {EVENT.year}
        </p>
      </div>
    </div>
  )
}
