import { BadgeFace } from './BadgeFace'
import { Lanyard } from './Lanyard'

interface LandingProps {
  onStart: () => void
}

const BG = `${import.meta.env.BASE_URL}landing-scan-2.webp`
const BADGE_W = 320
const BODY_H = 100
const FOOT_H = 188

export function Landing({ onStart }: LandingProps) {
  return (
    <div className="landing-hero relative isolate min-h-dvh overflow-hidden">
      <img
        src={BG}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
      />

      <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 pb-8 pt-6">
        <div className="landing-stage relative flex flex-col items-center">
          <Lanyard cord="ink" scale={1} className="lanyard-offscreen" />
          <BadgeFace
            width={BADGE_W}
            footVideo="signal"
            border="none"
            bodyHeight={BODY_H}
            footHeight={FOOT_H}
            className="landing-badge relative z-[1]"
            body={null}
          />
        </div>

        <div className="landing-copy relative z-20 mt-8 max-w-md text-center sm:mt-9">
          <h1 className="landing-kicker">
            You made it to
            <br />
            Common Ground!
          </h1>
          <p className="landing-lede">
            Your making journey starts here. Grab your{' '}
            <button
              type="button"
              onClick={onStart}
              className="landing-badge-btn"
              aria-label="Grab your badge"
            >
              badge!
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
