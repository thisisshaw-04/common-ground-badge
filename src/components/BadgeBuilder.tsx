import { useRef, type ChangeEvent, type RefObject, type ReactNode } from 'react'
import { toPng } from 'html-to-image'
import {
  EVENT,
  ROLES,
  THEMES,
  TRACKS,
  VIBES,
  type BadgeData,
  type RoleId,
  type ThemeId,
  type TrackId,
  type VibeId,
} from '../lib/badge'

interface BadgePreviewProps {
  data: BadgeData
  scale?: number
  exportRef?: RefObject<HTMLDivElement | null>
}

export function BadgePreview({ data, scale = 1, exportRef }: BadgePreviewProps) {
  const theme = THEMES[data.theme]
  const track = TRACKS[data.track]
  const role = ROLES[data.role]
  const vibe = VIBES[data.vibe]
  const displayName = data.name.trim() || 'Your Name'

  return (
    <div
      ref={exportRef}
      className="relative origin-top"
      style={{
        width: 360,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
      }}
    >
      {/* Lanyard cord */}
      <div className="mx-auto flex w-[72px] flex-col items-center">
        <div
          className="h-16 w-[10px] rounded-full"
          style={{
            background: `linear-gradient(180deg, ${theme.accent}, ${theme.stripe})`,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
          }}
        />
        <div
          className="-mt-1 h-4 w-4 rounded-full border-2"
          style={{
            borderColor: theme.accent,
            background: theme.badgeBg,
          }}
        />
      </div>

      {/* Badge body */}
      <div
        className="relative -mt-1 overflow-hidden rounded-[22px] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        style={{
          background: theme.badgeBg,
          color: theme.badgeFg,
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent, transparent 11px, currentColor 11px, currentColor 12px),
              repeating-linear-gradient(0deg, transparent, transparent 11px, currentColor 11px, currentColor 12px)
            `,
          }}
        />
        <div
          className="h-2 w-full"
          style={{
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.stripe}, ${track.color})`,
          }}
        />

        <div className="relative p-5 pb-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-70">
                {EVENT.name}
              </p>
              <p className="font-display text-lg font-bold leading-none tracking-tight">
                {EVENT.subtitle}
              </p>
            </div>
            <div
              className="rounded-full px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide"
              style={{
                background: `${track.color}22`,
                color: track.color,
                border: `1px solid ${track.color}55`,
              }}
            >
              {track.short}
            </div>
          </div>

          <div className="mb-4 flex gap-4">
            <div
              className="relative h-[108px] w-[108px] shrink-0 overflow-hidden rounded-2xl"
              style={{
                background: `linear-gradient(145deg, ${theme.accent}33, ${theme.stripe}22)`,
                border: `1px solid ${theme.badgeFg}18`,
              }}
            >
              {data.photoUrl ? (
                <img
                  src={data.photoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full font-display text-lg font-bold"
                    style={{ background: `${theme.accent}33`, color: theme.accent }}
                  >
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="font-mono text-[9px] opacity-50">PHOTO</span>
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <h2 className="font-display text-[28px] leading-[0.95] font-extrabold tracking-[-0.03em] break-words">
                {displayName}
              </h2>
              {data.pronouns.trim() ? (
                <p className="mt-1.5 font-mono text-xs opacity-60">
                  {data.pronouns.trim()}
                </p>
              ) : null}
              <p className="mt-3 text-sm leading-snug opacity-80">{track.label}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className="rounded-md px-2.5 py-1 font-mono text-[11px] font-medium tracking-wide"
              style={{
                background: role.color,
                color: '#0a1210',
              }}
            >
              {role.label}
            </span>
            <span
              className="rounded-md border px-2.5 py-1 font-mono text-[11px] font-medium tracking-wide"
              style={{
                borderColor: `${vibe.color}88`,
                color: vibe.color,
                background: `${vibe.color}14`,
              }}
            >
              {vibe.label}
            </span>
          </div>

          <div className="mt-5 flex items-end justify-between gap-3 border-t border-current/10 pt-4">
            <div>
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-50">
                {EVENT.date} · {EVENT.year}
              </p>
              <p className="mt-0.5 text-xs opacity-70">{EVENT.place}</p>
            </div>
            <div className="flex -space-x-2">
              <span
                className="h-6 w-6 rounded-full"
                style={{ background: theme.accent, opacity: 0.9 }}
              />
              <span
                className="h-6 w-6 rounded-full"
                style={{ background: theme.stripe, opacity: 0.85 }}
              />
              <span
                className="h-6 w-6 rounded-full"
                style={{ background: track.color, opacity: 0.8 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface BuilderProps {
  data: BadgeData
  onChange: (next: BadgeData) => void
  onBack: () => void
}

export function BadgeBuilder({ data, onChange, onBack }: BuilderProps) {
  const badgeRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const exporting = useRef(false)

  const set = <K extends keyof BadgeData>(key: K, value: BadgeData[K]) => {
    onChange({ ...data, [key]: value })
  }

  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.')
      return
    }
    if (data.photoUrl) URL.revokeObjectURL(data.photoUrl)
    set('photoUrl', URL.createObjectURL(file))
  }

  const clearPhoto = () => {
    if (data.photoUrl) URL.revokeObjectURL(data.photoUrl)
    set('photoUrl', null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const download = async (ratio: 'story' | 'grid') => {
    if (!badgeRef.current || exporting.current) return
    exporting.current = true
    try {
      const node = badgeRef.current
      const width = 1080
      const height = ratio === 'story' ? 1920 : 1440

      const exportRoot = document.createElement('div')
      exportRoot.style.width = `${width}px`
      exportRoot.style.height = `${height}px`
      exportRoot.style.background =
        'radial-gradient(circle at 30% 20%, #14383d 0%, #071a1c 55%, #040f10 100%)'
      exportRoot.style.display = 'flex'
      exportRoot.style.alignItems = 'center'
      exportRoot.style.justifyContent = 'center'
      exportRoot.style.position = 'fixed'
      exportRoot.style.left = '-10000px'
      exportRoot.style.top = '0'
      exportRoot.style.zIndex = '-1'

      const badgeClone = node.cloneNode(true) as HTMLElement
      badgeClone.style.transform = 'scale(2.2)'
      badgeClone.style.transformOrigin = 'center center'
      exportRoot.appendChild(badgeClone)
      document.body.appendChild(exportRoot)

      await Promise.all(
        Array.from(exportRoot.querySelectorAll('img')).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((res) => {
                img.onload = () => res()
                img.onerror = () => res()
              }),
        ),
      )

      const dataUrl = await toPng(exportRoot, {
        width,
        height,
        pixelRatio: 1,
        cacheBust: true,
      })

      document.body.removeChild(exportRoot)

      const link = document.createElement('a')
      const safeName = (data.name.trim() || 'maker').replace(/\s+/g, '-')
      link.download =
        ratio === 'story'
          ? `CommonGround-${safeName}-Story.png`
          : `CommonGround-${safeName}-Grid.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error(err)
      alert(
        'Could not export the badge. Try again without a photo, or use a smaller image.',
      )
    } finally {
      exporting.current = false
    }
  }

  const share = async () => {
    const text = `I'm building at Common Ground Makeathon — ${TRACKS[data.track].label}. ${EVENT.date} at ${EVENT.place}. ${EVENT.luma}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Common Ground Makeathon Badge',
          text,
          url: EVENT.luma,
        })
        return
      }
    } catch {
      // fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(text)
      alert('Share text copied to clipboard.')
    } catch {
      alert(text)
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12 lg:px-8 lg:py-12">
      <section className="animate-rise">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 font-mono text-xs tracking-[0.16em] text-[var(--ink-muted)] uppercase transition hover:text-[var(--ink)]"
        >
          ← Back
        </button>

        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Build your badge
        </h1>
        <p className="mt-2 max-w-xl text-[var(--ink-muted)]">
          Personalize a name tag for {EVENT.name}. Download it for stories, grids, or
          print day-of.
        </p>

        <div className="mt-8 space-y-6">
          <Field label="Display name">
            <input
              value={data.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="What should we call you?"
              maxLength={32}
              className="field-input"
            />
          </Field>

          <Field label="Pronouns (optional)">
            <input
              value={data.pronouns}
              onChange={(e) => set('pronouns', e.target.value)}
              placeholder="they/them, she/her, he/him…"
              maxLength={24}
              className="field-input"
            />
          </Field>

          <Field label="Track">
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(TRACKS) as TrackId[]).map((id) => {
                const t = TRACKS[id]
                const active = data.track === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => set('track', id)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? 'border-transparent bg-[var(--bg-lift)]'
                        : 'border-white/10 bg-transparent hover:border-white/25'
                    }`}
                    style={
                      active
                        ? { boxShadow: `inset 0 0 0 1px ${t.color}` }
                        : undefined
                    }
                  >
                    <span
                      className="font-mono text-[10px] tracking-[0.18em] uppercase"
                      style={{ color: t.color }}
                    >
                      {t.short}
                    </span>
                    <span className="mt-1 block font-display text-base font-semibold">
                      {t.label}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--ink-muted)]">
                      {t.blurb}
                    </span>
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Role">
            <ChipRow>
              {(Object.keys(ROLES) as RoleId[]).map((id) => (
                <Chip
                  key={id}
                  active={data.role === id}
                  color={ROLES[id].color}
                  onClick={() => set('role', id)}
                >
                  {ROLES[id].label}
                </Chip>
              ))}
            </ChipRow>
          </Field>

          <Field label="Vibe sticker">
            <ChipRow>
              {(Object.keys(VIBES) as VibeId[]).map((id) => (
                <Chip
                  key={id}
                  active={data.vibe === id}
                  color={VIBES[id].color}
                  onClick={() => set('vibe', id)}
                  outline
                >
                  {VIBES[id].label}
                </Chip>
              ))}
            </ChipRow>
          </Field>

          <Field label="Badge theme">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(THEMES) as ThemeId[]).map((id) => {
                const t = THEMES[id]
                const active = data.theme === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => set('theme', id)}
                    className={`overflow-hidden rounded-xl border text-left transition ${
                      active ? 'border-white/40' : 'border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div
                      className="h-12"
                      style={{
                        background: `linear-gradient(135deg, ${t.badgeBg}, ${t.accent}55 60%, ${t.stripe})`,
                      }}
                    />
                    <div className="px-2.5 py-2 font-mono text-[10px] tracking-wide uppercase opacity-80">
                      {t.label}
                    </div>
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Photo">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPhoto}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#1a0a05] transition hover:brightness-110"
              >
                Upload photo
              </button>
              {data.photoUrl ? (
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-[var(--ink-muted)] transition hover:border-white/30 hover:text-[var(--ink)]"
                >
                  Remove
                </button>
              ) : (
                <span className="text-xs text-[var(--ink-muted)]">
                  Optional — initials show if empty
                </span>
              )}
            </div>
          </Field>
        </div>
      </section>

      <aside className="animate-rise-delay-1 lg:sticky lg:top-8">
        <div className="rounded-3xl border border-white/10 bg-[var(--bg-mid)]/80 p-5 backdrop-blur-sm sm:p-6">
          <p className="mb-4 font-mono text-[10px] tracking-[0.2em] text-[var(--ink-muted)] uppercase">
            Live preview
          </p>
          <div className="flex justify-center overflow-hidden py-2">
            <div className="origin-top scale-[0.92] sm:scale-100">
              <BadgePreview data={data} exportRef={badgeRef} />
            </div>
          </div>

          <div className="mt-6 grid gap-2">
            <button
              type="button"
              onClick={() => download('story')}
              className="rounded-xl bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-white"
            >
              Download 9:16 (Story)
            </button>
            <button
              type="button"
              onClick={() => download('grid')}
              className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold transition hover:border-white/40 hover:bg-white/5"
            >
              Download 3:4 (Grid)
            </button>
            <button
              type="button"
              onClick={share}
              className="rounded-xl px-4 py-3 text-sm font-medium text-[var(--ink-muted)] transition hover:text-[var(--ink)]"
            >
              Share event link
            </button>
          </div>
          <p className="mt-3 text-center text-[11px] text-[var(--ink-muted)]">
            Event details on{' '}
            <a
              href={EVENT.luma}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[var(--mint)]/50 underline-offset-2 hover:text-[var(--mint)]"
            >
              Luma
            </a>
          </p>
        </div>
      </aside>

      <style>{`
        .field-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.12);
          background: color-mix(in oklab, var(--bg-lift) 80%, transparent);
          padding: 0.75rem 1rem;
          color: var(--ink);
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .field-input:focus {
          border-color: color-mix(in oklab, var(--accent) 70%, white);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 25%, transparent);
        }
        .field-input::placeholder {
          color: color-mix(in oklab, var(--ink-muted) 80%, transparent);
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] tracking-[0.18em] text-[var(--ink-muted)] uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}

function Chip({
  children,
  active,
  color,
  onClick,
  outline,
}: {
  children: ReactNode
  active: boolean
  color: string
  onClick: () => void
  outline?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-2.5 py-1.5 font-mono text-[11px] font-medium tracking-wide transition"
      style={
        active
          ? outline
            ? {
                color,
                border: `1px solid ${color}`,
                background: `${color}18`,
              }
            : {
                background: color,
                color: '#0a1210',
                border: `1px solid ${color}`,
              }
          : {
              color: 'var(--ink-muted)',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
            }
      }
    >
      {children}
    </button>
  )
}
