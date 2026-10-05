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
    <div className="page-light flex h-dvh flex-col overflow-hidden">
      <main className="relative mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center overflow-y-auto px-4 py-6 text-center sm:py-8">
        <div className="animate-pop">
          <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--muted)] uppercase">
            You did it
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">
            your badge is ready
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
            Save it for stories, post it everywhere, then show up on {EVENT.date}{' '}
            at {EVENT.place}.
          </p>
        </div>

        <div
          ref={previewRef}
          className="animate-floaty mt-6 scale-[0.92] sm:scale-100"
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

        <div className="animate-pop mt-6 grid w-full max-w-sm gap-2 pb-4">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => exportPng('story')}
            className="rounded-full bg-[var(--blue)] px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy === 'story' ? 'Saving…' : 'Save 9:16 Story'}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => exportPng('grid')}
            className="rounded-full bg-white px-4 py-3.5 text-sm font-semibold text-black ring-1 ring-black/10 disabled:opacity-60"
          >
            {busy === 'grid' ? 'Saving…' : 'Save 3:4 Grid'}
          </button>
          <button
            type="button"
            onClick={share}
            className="rounded-full bg-[var(--panel)] px-4 py-3.5 text-sm font-semibold text-black ring-1 ring-black/10"
          >
            {copied ? 'Copied link!' : 'Share to socials'}
          </button>
          <button
            type="button"
            onClick={tweet}
            className="rounded-full px-4 py-3 text-sm font-medium text-[var(--muted)] hover:text-black"
          >
            Post on X / Twitter
          </button>
          <a
            href={EVENT.luma}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[var(--muted)] underline decoration-[var(--blue)]/40 underline-offset-2 hover:text-[var(--blue)]"
          >
            Event on Luma
          </a>
          <button
            type="button"
            onClick={onEdit}
            className="mt-1 text-sm font-semibold text-[var(--blue)]"
          >
            ← Keep editing
          </button>
        </div>
      </main>
      <div className="event-bar relative z-20 shrink-0 px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px] sm:text-sm">
          <p className="font-semibold tracking-tight">
            <span className="font-display italic font-medium">{EVENT.name}</span>
            <span className="mx-2 font-black uppercase">{EVENT.subtitle}</span>
          </p>
          <p className="font-mono text-[11px] tracking-wide text-black/70 uppercase sm:text-xs">
            {EVENT.date} · {EVENT.year} · {EVENT.place}
          </p>
        </div>
      </div>
    </div>
  )
}
