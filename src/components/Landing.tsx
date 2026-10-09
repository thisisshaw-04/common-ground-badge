import { useEffect, useRef } from 'react'
import { DEMO_STICKERS, stickerById } from '../lib/badge'
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
const MAX_RY = 16
const MAX_RX = 9

function useHangTilt() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const tiltRef = useRef<HTMLDivElement>(null)
  const shineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scene = sceneRef.current
    const tilt = tiltRef.current
    const shine = shineRef.current
    if (!scene || !tilt) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const target = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    let raf = 0

    const tick = () => {
      cur.x += (target.x - cur.x) * 0.14
      cur.y += (target.y - cur.y) * 0.14
      const ry = cur.x * MAX_RY
      const rx = cur.y * -MAX_RX
      tilt.style.transform = `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`
      if (shine) {
        const px = 50 + cur.x * 32
        const py = 40 + cur.y * 22
        shine.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.34), transparent 46%)`
        shine.style.opacity = String(0.35 + Math.hypot(cur.x, cur.y) * 0.4)
      }
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
      target.x = Math.max(-1, Math.min(1, nx * 1.35))
      target.y = Math.max(-1, Math.min(1, ny * 1.1))
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

  return { sceneRef, tiltRef, shineRef }
}

export function Landing({ onStart }: LandingProps) {
  const { sceneRef, tiltRef, shineRef } = useHangTilt()

  return (
    <div className="landing-hero relative isolate min-h-dvh overflow-hidden">
      <img
        src={BG}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
      />

      <main className="landing-main relative z-10 flex min-h-dvh flex-col items-center px-4 pb-10">
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
                        transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
                      }}
                    >
                      <StickerFace def={def} compact />
                    </span>
                  )
                })}
              />
              <div ref={shineRef} className="landing-tilt-shine" aria-hidden />
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
