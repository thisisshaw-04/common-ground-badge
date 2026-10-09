import { useEffect, useRef } from 'react'
import { DEMO_STICKERS, stickerBadgeTransform, stickerById } from '../lib/badge'
import { BadgeFace } from './BadgeFace'
import { Lanyard } from './Lanyard'
import { StickerFace } from './StickerFace'

interface LandingProps {
  onStart: () => void
}

const BG = `${import.meta.env.BASE_URL}landing-scan-3.webp`
const BADGE_W = 320
const BODY_H = 100
const FOOT_H = 188
const MAX_RY = 8
const MAX_RX = 4.5

function useHangTilt() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const tiltRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scene = sceneRef.current
    const tilt = tiltRef.current
    const glare = glareRef.current
    if (!scene || !tilt) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const target = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    let raf = 0

    const paintGlare = (x: number, y: number) => {
      if (!glare) return
      const mag = Math.hypot(x, y)
      glare.style.setProperty('--sx', `${(48 + x * 22).toFixed(2)}%`)
      glare.style.setProperty('--sy', `${(30 + y * 16).toFixed(2)}%`)
      glare.style.setProperty('--ang', `${(118 + x * 14).toFixed(2)}deg`)
      glare.style.setProperty('--glare-o', (0.26 + mag * 0.24).toFixed(3))
    }

    const tick = () => {
      cur.x += (target.x - cur.x) * 0.09
      cur.y += (target.y - cur.y) * 0.09
      const ry = cur.x * MAX_RY
      const rx = cur.y * -MAX_RX
      tilt.style.transform = `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`
      paintGlare(cur.x, cur.y)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const hero = (scene.closest('.landing-hero') ?? scene) as HTMLElement
    const onMove = (e: PointerEvent) => {
      const r = tilt.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height * 0.2
      const nx = (e.clientX - cx) / Math.max(r.width, 1)
      const ny = (e.clientY - cy) / Math.max(r.height, 1)
      target.x = Math.max(-1, Math.min(1, nx * 0.82))
      target.y = Math.max(-1, Math.min(1, ny * 0.7))
    }
    const onLeave = () => {
      target.x = 0
      target.y = 0
    }
    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return { sceneRef, tiltRef, glareRef }
}

export function Landing({ onStart }: LandingProps) {
  const { sceneRef, tiltRef, glareRef } = useHangTilt()

  return (
    <div className="landing-hero relative isolate min-h-dvh overflow-hidden">
      <img
        src={BG}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
      />

      <main className="landing-main relative z-10 flex min-h-dvh flex-col items-center px-4">
        <div ref={sceneRef} className="landing-tilt-scene">
          <div ref={tiltRef} className="landing-tilt">
            <Lanyard cord="ink" scale={1} className="lanyard-offscreen" />
            <div className="landing-badge-shell relative z-[1]">
              <BadgeFace
                width={BADGE_W}
                footVideo="signal"
                border="none"
                bodyHeight={BODY_H}
                footHeight={FOOT_H}
                className="landing-badge"
                body={null}
                overlay={DEMO_STICKERS.map((s) => {
                  const def = stickerById(s.defId)
                  if (!def) return null
                  return (
                    <span
                      key={s.uid}
                      className="sticker-on-badge pointer-events-none absolute"
                      style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        transform: stickerBadgeTransform(s.rotation),
                      }}
                    >
                      <StickerFace def={def} compact />
                    </span>
                  )
                })}
              />
              <div ref={glareRef} className="landing-tilt-glare" aria-hidden>
                <span className="landing-tilt-iris" />
                <span className="landing-tilt-streak" />
                <span className="landing-tilt-spec" />
              </div>
            </div>
          </div>
        </div>

        <div className="landing-copy relative z-20 max-w-md text-center">
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
