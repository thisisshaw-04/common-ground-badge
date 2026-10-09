import { toCanvas } from 'html-to-image'
import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  getFirstEncodableVideoCodec,
} from 'mediabunny'
import { footFramePath } from '../components/FootVideoFrame'

export interface StoryExportOptions {
  width: number
  height: number
  backgroundColor: string
}

export interface StoryVideoFile {
  blob: Blob
  ext: 'mp4' | 'webm'
}

const FPS = 24
const MIN_SECONDS = 1.5
const MAX_SECONDS = 2
/** 720-wide keeps WebCodecs / MediaRecorder reliable; 1080p timed out before. */
const MAX_VIDEO_WIDTH = 720
const MP4_BUDGET_MS = 32000

type Box = { x: number; y: number; w: number; h: number }
type Layer = { video: HTMLVideoElement; box: Box }

/** Constrained Baseline 3.1 — VLC, IG, and LinkedIn all play this. High 4:4:4 (0xF4) does not. */
const AVC_BASELINE = 'avc1.42E01F'
const AVC_MAIN = 'avc1.4D401F'
const AVC_HIGH_444 = 0xf4
const AVC_BITRATE = 2_400_000

const SNAPSHOT = {
  cacheBust: true,
  fontEmbedCSS: ' ',
  skipFonts: true,
} as const

function even(n: number) {
  const v = Math.max(2, Math.round(n))
  return v % 2 === 0 ? v : v - 1
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function seekVideo(video: HTMLVideoElement, time: number) {
  const dur = video.duration
  if (!Number.isFinite(dur) || dur <= 0) return Promise.resolve()
  const t = Math.min(Math.max(time, 0), Math.max(dur - 1 / FPS, 0))
  if (Math.abs(video.currentTime - t) < 1 / 90) return Promise.resolve()
  return new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      video.removeEventListener('seeked', finish)
      resolve()
    }
    video.addEventListener('seeked', finish)
    video.currentTime = t
    window.setTimeout(finish, 90)
  })
}

async function waitForVideo(video: HTMLVideoElement) {
  if (video.readyState >= 2 && video.videoWidth > 0) return
  await Promise.race([
    new Promise<void>((resolve) => {
      const ok = () => {
        if (video.videoWidth > 0) {
          video.removeEventListener('loadeddata', ok)
          resolve()
        }
      }
      video.addEventListener('loadeddata', ok)
      void video.play().then(() => video.pause()).catch(() => {})
    }),
    sleep(4000),
  ])
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const vw = video.videoWidth || w
  const vh = video.videoHeight || h
  const s = Math.max(w / vw, h / vh)
  const dw = vw * s
  const dh = vh * s
  ctx.drawImage(video, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
}

function mediaBox(node: HTMLElement, media: HTMLElement, width: number, height: number): Box {
  const nr = node.getBoundingClientRect()
  const mr = media.getBoundingClientRect()
  const sx = width / Math.max(1, nr.width)
  const sy = height / Math.max(1, nr.height)
  return {
    x: (mr.left - nr.left) * sx,
    y: (mr.top - nr.top) * sy,
    w: mr.width * sx,
    h: mr.height * sy,
  }
}

function unionBox(a: Box, b: Box): Box {
  const left = Math.min(a.x, b.x)
  const top = Math.min(a.y, b.y)
  const right = Math.max(a.x + a.w, b.x + b.w)
  const bottom = Math.max(a.y + a.h, b.y + b.h)
  return { x: left, y: top, w: right - left, h: bottom - top }
}

function restoreAttr(el: HTMLElement, name: 'style', prev: string | null) {
  if (prev === null) el.removeAttribute(name)
  else el.setAttribute(name, prev)
}

async function mp4AvcProfile(blob: Blob) {
  const buf = new Uint8Array(await blob.slice(0, 512_000).arrayBuffer())
  for (let i = 0; i < buf.length - 8; i++) {
    if (buf[i] === 0x61 && buf[i + 1] === 0x76 && buf[i + 2] === 0x63 && buf[i + 3] === 0x43) {
      return buf[i + 5] ?? null
    }
  }
  return null
}

function clipSeconds(primary: HTMLVideoElement | null) {
  if (primary && Number.isFinite(primary.duration) && primary.duration > 0) {
    return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, primary.duration))
  }
  return MIN_SECONDS
}

function paintFrame(
  ctx: CanvasRenderingContext2D,
  bgSnap: HTMLCanvasElement,
  badgeSnap: HTMLCanvasElement | null,
  badgeBox: Box | null,
  layers: Layer[],
  width: number,
  height: number,
  backgroundColor: string,
) {
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bgSnap, 0, 0, width, height)
  if (badgeSnap && badgeBox) {
    ctx.drawImage(badgeSnap, badgeBox.x, badgeBox.y, badgeBox.w, badgeBox.h)
  }
  for (const { video, box } of layers) {
    ctx.save()
    ctx.translate(box.x, box.y)
    try {
      ctx.clip(new Path2D(footFramePath(box.w, box.h)))
    } catch {
      /* rectangular fallback */
    }
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, box.w, box.h)
    drawCover(ctx, video, 0, 0, box.w, box.h)
    ctx.restore()
  }
}

async function sniffExt(blob: Blob): Promise<'mp4' | 'webm'> {
  const buf = new Uint8Array(await blob.slice(0, 16).arrayBuffer())
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    throw new Error('Encoder produced a GIF, not a video.')
  }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'webm'
  const tag = String.fromCharCode(buf[4], buf[5], buf[6], buf[7])
  if (tag === 'ftyp') return 'mp4'
  if (blob.type.includes('mp4')) return 'mp4'
  if (blob.type.includes('webm')) return 'webm'
  throw new Error('Encoder produced an unknown file, not a video.')
}

function recorderMime() {
  const types = [
    `video/mp4;codecs="${AVC_BASELINE}"`,
    `video/mp4;codecs="${AVC_MAIN}"`,
    'video/mp4;codecs="avc1.42E01E"',
    'video/mp4',
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9',
    'video/webm',
  ]
  return types.find((type) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) ?? ''
}

type AvcTry = {
  fullCodecString?: string
  hardwareAcceleration: 'prefer-software' | 'no-preference'
  bitrate: number
}

const AVC_TRIES: AvcTry[] = [
  { fullCodecString: AVC_BASELINE, hardwareAcceleration: 'prefer-software', bitrate: AVC_BITRATE },
  { fullCodecString: AVC_MAIN, hardwareAcceleration: 'prefer-software', bitrate: AVC_BITRATE },
  { fullCodecString: AVC_BASELINE, hardwareAcceleration: 'no-preference', bitrate: 2_000_000 },
  { hardwareAcceleration: 'prefer-software', bitrate: 2_000_000 },
]

async function encodeMp4Once(
  canvas: HTMLCanvasElement,
  paint: () => void,
  primary: HTMLVideoElement | null,
  clip: number,
  signal: AbortSignal,
  tryCfg: AvcTry,
) {
  if (signal.aborted) throw new Error('MP4 encoding cancelled.')
  const format = new Mp4OutputFormat({ fastStart: 'in-memory' })
  const codec = await getFirstEncodableVideoCodec(['avc'], {
    width: canvas.width,
    height: canvas.height,
    bitrate: tryCfg.bitrate,
    frameRate: FPS,
  })
  if (!codec) throw new Error('No MP4 video codec in this browser.')
  if (signal.aborted) throw new Error('MP4 encoding cancelled.')

  const target = new BufferTarget()
  const output = new Output({ format, target })
  const source = new CanvasSource(canvas, {
    codec,
    bitrate: tryCfg.bitrate,
    keyFrameInterval: 0.5,
    alpha: 'discard',
    fullCodecString: tryCfg.fullCodecString,
    hardwareAcceleration: tryCfg.hardwareAcceleration,
    latencyMode: 'quality',
  })
  output.addVideoTrack(source, { frameRate: FPS })
  await output.start()

  const abort = () => {
    void output.cancel().catch(() => {})
  }
  signal.addEventListener('abort', abort)

  const frameCount = Math.max(1, Math.round(clip * FPS))
  try {
    for (let i = 0; i < frameCount; i++) {
      if (signal.aborted) throw new Error('MP4 encoding cancelled.')
      if (primary) await seekVideo(primary, (i / FPS) % Math.max(primary.duration || clip, 0.1))
      paint()
      await source.add(i / FPS, 1 / FPS)
    }
    await output.finalize()
  } catch (err) {
    await output.cancel().catch(() => {})
    throw err
  } finally {
    signal.removeEventListener('abort', abort)
  }

  const buffer = target.buffer
  if (!buffer || buffer.byteLength < 64) throw new Error('MP4 encoding produced an empty file.')
  const blob = new Blob([buffer], { type: 'video/mp4' })
  const profile = await mp4AvcProfile(blob)
  if (profile === AVC_HIGH_444) {
    throw new Error('Encoder produced High 4:4:4 H.264, which many players cannot decode.')
  }
  return blob
}

async function encodeMp4(
  canvas: HTMLCanvasElement,
  paint: () => void,
  primary: HTMLVideoElement | null,
  clip: number,
  signal: AbortSignal,
) {
  let last: unknown
  for (const tryCfg of AVC_TRIES) {
    try {
      return await encodeMp4Once(canvas, paint, primary, clip, signal, tryCfg)
    } catch (err) {
      last = err
      if (signal.aborted) throw err
    }
  }
  throw last instanceof Error ? last : new Error('MP4 encoding failed.')
}

async function encodeRecorder(
  canvas: HTMLCanvasElement,
  paint: () => void,
  layers: Layer[],
  clip: number,
) {
  const mime = recorderMime()
  if (!mime) throw new Error('This browser cannot record video from a canvas.')

  canvas.style.cssText = 'position:fixed;left:-99999px;top:0;pointer-events:none'
  document.body.appendChild(canvas)

  const stream = canvas.captureStream(FPS)
  const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void }
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 3_500_000 })
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data)
  }

  const stopped = new Promise<void>((resolve, reject) => {
    rec.onstop = () => resolve()
    rec.onerror = () => reject(new Error('MediaRecorder failed.'))
  })

  for (const { video } of layers) {
    video.loop = true
    video.muted = true
    void video.play().catch(() => {})
  }

  paint()
  track.requestFrame?.()
  rec.start(200)

  const started = performance.now()
  await new Promise<void>((resolve) => {
    const tick = () => {
      paint()
      track.requestFrame?.()
      if (performance.now() - started >= clip * 1000) {
        resolve()
        return
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

  if (rec.state !== 'inactive') rec.stop()
  await Promise.race([stopped, sleep(2000)])
  stream.getTracks().forEach((t) => t.stop())
  canvas.remove()

  const blob = new Blob(chunks, { type: mime.split(';')[0] })
  if (blob.size < 64) throw new Error('Video recording produced an empty file.')
  return blob
}

async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  ms: number,
  message: string,
) {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), ms)
  try {
    return await run(ctrl.signal)
  } catch (err) {
    if (ctrl.signal.aborted) throw new Error(message)
    throw err
  } finally {
    window.clearTimeout(timer)
    if (!ctrl.signal.aborted) ctrl.abort()
  }
}

/** Story / grid card → looping video, with the foot clip still moving. */
export async function exportStoryVideo(node: HTMLElement, opts: StoryExportOptions): Promise<StoryVideoFile> {
  const scale = Math.min(1, MAX_VIDEO_WIDTH / Math.max(1, opts.width))
  const width = even(opts.width * scale)
  const height = even(opts.height * scale)
  const videos = [...node.querySelectorAll('video')]
  const hidden: HTMLVideoElement[] = []

  for (const video of videos) {
    hidden.push(video)
    video.style.opacity = '0'
    await waitForVideo(video)
  }

  if (!node.clientWidth || !node.clientHeight) {
    throw new Error('The poster is not on screen yet — wait a beat and try again.')
  }

  const filterRestore: { el: HTMLElement; filter: string }[] = []
  for (const el of [node, ...node.querySelectorAll<HTMLElement>('*')]) {
    if (getComputedStyle(el).filter === 'none') continue
    filterRestore.push({ el, filter: el.style.filter })
    el.style.filter = 'none'
  }

  await sleep(60)

  const layers = videos
    .map((video) => {
      const media = (video.closest('.foot-frame-media') as HTMLElement | null) ?? video
      return { video, box: mediaBox(node, media, width, height) }
    })
    .filter((layer) => layer.video.videoWidth > 0)

  const fit = node.querySelector('[data-story-fit]') as HTMLElement | null
  const lan = fit?.querySelector('.lanyard-hang') as HTMLElement | null
  const fitBox = fit ? mediaBox(node, fit, width, height) : null
  const lanBox = lan ? mediaBox(node, lan, width, height) : null
  const badgeBox = fitBox && lanBox ? unionBox(fitBox, lanBox) : fitBox
  const ratio = width / Math.max(1, node.clientWidth)

  let bgSnap: HTMLCanvasElement
  let badgeSnap: HTMLCanvasElement | null = null
  try {
    bgSnap = await toCanvas(node, {
      ...SNAPSHOT,
      pixelRatio: ratio,
      backgroundColor: opts.backgroundColor,
      filter: (el) => !el.hasAttribute('data-story-fit'),
    })

    if (fit) {
      const prevFit = fit.getAttribute('style')
      const prevLan = lan?.getAttribute('style') ?? null
      try {
        fit.style.transform = 'none'
        fit.style.left = '0px'
        fit.style.top = '0px'
        fit.style.position = 'relative'
        if (lan) {
          lan.style.position = 'relative'
          lan.style.left = 'auto'
          lan.style.bottom = 'auto'
          lan.style.transform = 'none'
          lan.style.marginLeft = 'auto'
          lan.style.marginRight = 'auto'
        }
        await sleep(40)
        badgeSnap = await toCanvas(fit, {
          ...SNAPSHOT,
          pixelRatio: badgeBox ? badgeBox.w / Math.max(1, fit.offsetWidth) : ratio,
        })
      } finally {
        restoreAttr(fit, 'style', prevFit)
        if (lan) restoreAttr(lan, 'style', prevLan)
      }
    }
  } finally {
    for (const { el, filter } of filterRestore) el.style.filter = filter
    for (const video of hidden) video.style.opacity = ''
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Could not open a canvas to record.')

  const paint = () =>
    paintFrame(ctx, bgSnap, badgeSnap, badgeBox, layers, width, height, opts.backgroundColor)
  const primary = layers[0]?.video ?? null
  const clip = clipSeconds(primary)
  const wasPlaying = primary ? !primary.paused : false
  const resumeAt = primary?.currentTime ?? 0

  const resume = () => {
    if (!primary) return
    primary.currentTime = resumeAt
    if (wasPlaying) void primary.play().catch(() => {})
  }

  try {
    if (primary) {
      primary.pause()
      primary.loop = true
    }

    let blob: Blob | null = null
    try {
      blob = await withTimeout(
        (signal) => encodeMp4(canvas, paint, primary, clip, signal),
        MP4_BUDGET_MS,
        'MP4 encoding took too long.',
      )
    } catch (err) {
      console.warn('MP4 encoder failed, recording canvas instead.', err)
      blob = await encodeRecorder(canvas, paint, layers, clip)
    }

    const ext = await sniffExt(blob)
    return { blob, ext }
  } finally {
    resume()
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  window.setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(url)
  }, 4000)
}
