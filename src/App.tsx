import { useState } from 'react'
import { BadgeBuilder, BadgePreview } from './components/BadgeBuilder'
import { DEFAULT_BADGE, EVENT, type BadgeData } from './lib/badge'

type Screen = 'landing' | 'builder'

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [badge, setBadge] = useState<BadgeData>(DEFAULT_BADGE)

  return (
    <div className="weave-bg relative min-h-dvh overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(62,207,142,0.12),_transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(255,107,53,0.14),_transparent_40%)]"
      />

      {screen === 'landing' ? (
        <Landing
          preview={badge}
          onStart={() => setScreen('builder')}
        />
      ) : (
        <BadgeBuilder
          data={badge}
          onChange={setBadge}
          onBack={() => setScreen('landing')}
        />
      )}
    </div>
  )
}

function Landing({
  preview,
  onStart,
}: {
  preview: BadgeData
  onStart: () => void
}) {
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-6xl flex-col justify-center px-4 py-10 sm:px-8 lg:py-16">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:gap-16">
        <div>
          <p className="animate-rise font-mono text-xs tracking-[0.28em] text-[var(--mint)] uppercase">
            {EVENT.date} · {EVENT.place}
          </p>

          <h1 className="animate-rise-delay-1 mt-4 font-display text-[clamp(3rem,9vw,5.75rem)] leading-[0.88] font-extrabold tracking-[-0.04em]">
            <span className="block text-[var(--ink)]">{EVENT.name}</span>
            <span className="mt-1 block bg-gradient-to-r from-[var(--accent)] via-[var(--gold)] to-[var(--mint)] bg-clip-text text-transparent">
              {EVENT.subtitle}
            </span>
          </h1>

          <p className="animate-rise-delay-2 mt-5 max-w-md text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
            {EVENT.tagline}. Claim your badge, pick a track, and show up ready to
            weave design, tech, and culture into something new.
          </p>

          <div className="animate-rise-delay-2 mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="group relative overflow-hidden rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[#1a0a05] transition hover:brightness-110"
            >
              <span className="relative z-10">Build your badge</span>
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition duration-700 group-hover:translate-x-full"
              />
            </button>
            <a
              href={EVENT.luma}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 px-5 py-3.5 text-sm font-medium text-[var(--ink-muted)] transition hover:border-white/35 hover:text-[var(--ink)]"
            >
              Event on Luma
            </a>
          </div>

          <p className="mt-8 max-w-sm text-xs leading-relaxed text-[var(--ink-muted)]/80">
            One-day creative tech makeathon at SQ Collective. Two tracks, Codex
            credits, and a $5,000 prize pool — bring curious vibes.
          </p>
        </div>

        <div className="animate-rise-delay-1 relative mx-auto w-full max-w-[380px]">
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--mint)]/20 blur-3xl"
            style={{ animation: 'pulse-ring 3.5s ease-out infinite' }}
          />
          <div className="animate-float relative flex justify-center">
            <BadgePreview data={{ ...preview, name: preview.name || 'Maker' }} />
          </div>
        </div>
      </div>
    </main>
  )
}
