import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { EVENT, type BadgeState } from '../lib/badge'

interface DoneProps {
  state: BadgeState
  badgeNode: HTMLDivElement | null
  onEdit: () => void
}

export function DoneScreen({ state, badgeNode, onEdit }: DoneProps) {
  const [busy, setBusy] = useState<'story' | 'grid' | null>(null)
  const [copied, setCopied] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const exportPng = async (ratio: 'story' | 'grid') => {
    if (!badgeNode || busy) return
    setBusy(ratio)
    try {
      const width = 1080
      const height = ratio === 'story' ? 1920 : 1440
      const root = document.createElement('div')
      root.style.width = `${width}px`
      root.style.height = `${height}px`
      root.style.background = '#050505'
      root.style.display = 'flex'
      root.style.alignItems = 'center'
      root.style.justifyContent = 'center'
      root.style.position = 'fixed'
      root.style.left = '-12000px'
      root.style.top = '0'
      const clone = badgeNode.cloneNode(true) as HTMLElement
      // freeze inputs as text
      clone.querySelectorAll('input').forEach((input) => {
        const span = document.createElement('div')
        span.className = input.className
        span.textContent = (input as HTMLInputElement).value || 'maker'
        span.style.pointerEvents = 'none'
        input.replaceWith(span)
      })
      clone.style.transform = 'scale(2.4)'
      clone.style.transformOrigin = 'center center'
      root.appendChild(clone)
      document.body.appendChild(root)
      await new Promise((r) => setTimeout(r, 80))
      const url = await toPng(root, { width, height, pixelRatio: 1, cacheBust: true })
      document.body.removeChild(root)
      const a = document.createElement('a')
      const name = (state.name.trim() || 'maker').replace(/\s+/g, '-')
      a.download =
        ratio === 'story'
          ? `CommonGround-${name}-Story.png`
          : `CommonGround-${name}-Grid.png`
      a.href = url
      a.click()
    } catch (err) {
      console.error(err)
      alert('Could not export — try again.')
    } finally {
      setBusy(null)
    }
  }

  const shareText = `I made my Common Ground Makeathon badge! ${EVENT.date} · ${EVENT.place}\n${EVENT.site}\n${EVENT.luma}`

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Common Ground Badge',
          text: shareText,
          url: EVENT.site,
        })
        return
      }
    } catch {
      /* fall through */
    }
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tweet = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-3xl flex-col items-center px-4 py-12 text-center">
      <div className="animate-pop">
        <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--yellow)] uppercase">
          Track locked
        </p>
        <h1 className="font-display mt-2 text-4xl font-extrabold tracking-tight text-[var(--yellow)] sm:text-5xl">
          Your badge is ready
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
          Save it for stories, post it everywhere, then show up on {EVENT.date} at{' '}
          {EVENT.place}.
        </p>
      </div>

      <div
        ref={previewRef}
        className="animate-floaty mt-10 scale-[0.92] sm:scale-100"
      >
        {badgeNode ? (
          <div
            className="pointer-events-none"
            dangerouslySetInnerHTML={{
              __html: (() => {
                const clone = badgeNode.cloneNode(true) as HTMLElement
                clone.querySelectorAll('input').forEach((input) => {
                  const span = document.createElement('div')
                  span.className = input.className
                  span.textContent =
                    (input as HTMLInputElement).value || 'your name'
                  input.replaceWith(span)
                })
                clone.querySelectorAll('canvas').forEach((c) => {
                  if (state.drawingDataUrl) {
                    const img = document.createElement('img')
                    img.src = state.drawingDataUrl
                    img.className = 'absolute inset-0 z-10 h-full w-full'
                    img.alt = ''
                    c.replaceWith(img)
                  }
                })
                return clone.outerHTML
              })(),
            }}
          />
        ) : null}
      </div>

      <div className="animate-pop mt-8 grid w-full max-w-sm gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => exportPng('story')}
          className="rounded-xl bg-[var(--yellow)] px-4 py-3.5 text-sm font-semibold text-black disabled:opacity-60"
        >
          {busy === 'story' ? 'Saving…' : 'Save 9:16 Story'}
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => exportPng('grid')}
          className="rounded-xl bg-white/5 px-4 py-3.5 text-sm font-semibold text-white ring-1 ring-white/20 disabled:opacity-60"
        >
          {busy === 'grid' ? 'Saving…' : 'Save 3:4 Grid'}
        </button>
        <button
          type="button"
          onClick={share}
          className="rounded-xl bg-[var(--mint)] px-4 py-3.5 text-sm font-semibold text-black shadow-[0_6px_0_#1a8a5c] transition active:translate-y-1 active:shadow-none"
        >
          {copied ? 'Copied link!' : 'Share to socials'}
        </button>
        <button
          type="button"
          onClick={tweet}
          className="rounded-xl px-4 py-3 text-sm font-medium text-[var(--muted)] hover:text-white"
        >
          Post on X / Twitter
        </button>
        <a
          href={EVENT.luma}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-[var(--muted)] underline decoration-[var(--yellow)]/50 underline-offset-2 hover:text-[var(--yellow)]"
        >
          Event on Luma
        </a>
        <button
          type="button"
          onClick={onEdit}
          className="mt-2 text-sm font-semibold text-[var(--yellow)]"
        >
          ← Keep editing
        </button>
      </div>
    </main>
  )
}
