import { toCanvas } from 'html-to-image'
import {
  BufferTarget,
  Mp4OutputFormat,
  Output,
  VideoSample,
  VideoSampleSource,
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
  ext: 'mp4'
}

const FPS = 30
const MIN_SECONDS = 1.5
const MAX_SECONDS = 2
/** 720-wide keeps WebCodecs reliable and matches H.264 Level 3.1. */
const MAX_VIDEO_WIDTH = 720
const MP4_BUDGET_MS = 45000

type Box = { x: number; y: number; w: number; h: number }
type Layer = { video: HTMLVideoElement; box: Box }

/** Constrained Baseline 3.1 — iPhone, Android, IG, LinkedIn, VLC. */
const AVC_BASELINE = 'avc1.42E01F'
const AVC_MAIN = 'avc1.4D401F'
const AVC_BITRATE = 2_800_000

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
    window.setTimeout(finish, 120)
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

async function hiddenVideoCopy(video: HTMLVideoElement) {
  const copy = document.createElement('video')
  copy.src = video.currentSrc || video.src
  copy.muted = true
  copy.defaultMuted = true
  copy.playsInline = true
  copy.setAttribute('playsinline', '')
  copy.preload = 'auto'
  copy.crossOrigin = video.crossOrigin
  copy.style.cssText =
    'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none'
  document.body.appendChild(copy)
  await waitForVideo(copy)
  return copy
}

function paintFrame(
  ctx: CanvasRenderingContext2D,
  snap: HTMLCanvasElement,
  layers: Layer[],
  width: number,
  height: number,
  backgroundColor: string,
) {
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(snap, 0, 0, width, height)
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

function findAvcC(buf: Uint8Array) {
  for (let i = 0; i < buf.length - 8; i++) {
    if (buf[i] === 0x61 && buf[i + 1] === 0x76 && buf[i + 2] === 0x63 && buf[i + 3] === 0x43) {
      return i
    }
  }
  return -1
}

function phoneSafeAvcProfile(profile: number) {
  return profile === 0x42 || profile === 0x4d || profile === 0x64
}

async function assertPhoneSafeMp4(blob: Blob) {
  if (blob.size < 1024) throw new Error('MP4 file is empty.')
  const buf = new Uint8Array(await blob.slice(0, 768_000).arrayBuffer())
  const tag = String.fromCharCode(buf[4], buf[5], buf[6], buf[7])
  if (tag !== 'ftyp') throw new Error('Not a real MP4 (missing ftyp).')
  const avc = findAvcC(buf)
  if (avc < 0) throw new Error('MP4 is missing an H.264 track.')
  const profile = buf[avc + 5]
  if (!phoneSafeAvcProfile(profile)) {
    throw new Error(`H.264 profile 0x${profile.toString(16)} will not play on phones.`)
  }
}

type AvcTry = {
  fullCodecString?: string
  hardwareAcceleration: 'prefer-software' | 'no-preference'
  bitrate: number
}

const AVC_TRIES: AvcTry[] = [
  { fullCodecString: AVC_BASELINE, hardwareAcceleration: 'prefer-software', bitrate: AVC_BITRATE },
  { fullCodecString: AVC_BASELINE, hardwareAcceleration: 'no-preference', bitrate: AVC_BITRATE },
  { fullCodecString: AVC_MAIN, hardwareAcceleration: 'prefer-software', bitrate: AVC_BITRATE },
  { fullCodecString: AVC_MAIN, hardwareAcceleration: 'no-preference', bitrate: 2_200_000 },
]

function clipSeconds(primary: HTMLVideoElement | null) {
  if (primary && Number.isFinite(primary.duration) && primary.duration > 0) {
    return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, primary.duration))
  }
  return MIN_SECONDS
}

/** BT.709 limited-range I420 — phones want yuv420p (tv), not jpeg-range yuvj420p. */
function fillI420(rgba: Uint8ClampedArray, width: number, height: number, out: Uint8Array) {
  const ySize = width * height
  const cW = width >> 1
  const cH = height >> 1
  const uOff = ySize
  const vOff = ySize + cW * cH
  let yi = 0
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const p = (row * width + col) << 2
      const r = rgba[p]
      const g = rgba[p + 1]
      const b = rgba[p + 2]
      out[yi++] = ((47 * r + 157 * g + 16 * b) >> 8) + 16
      if ((row & 1) === 0 && (col & 1) === 0) {
        const ci = (row >> 1) * cW + (col >> 1)
        out[uOff + ci] = ((-26 * r - 87 * g + 112 * b) >> 8) + 128
        out[vOff + ci] = ((112 * r - 102 * g - 10 * b) >> 8) + 128
      }
    }
  }
}

function assertSnapHasContent(snap: HTMLCanvasElement, backgroundColor: string) {
  const ctx = snap.getContext('2d', { willReadFrequently: true })
  if (!ctx) return
  const { width, height } = snap
  const sample = ctx.getImageData(
    Math.floor(width * 0.3),
    Math.floor(height * 0.25),
    Math.max(1, Math.floor(width * 0.4)),
    Math.max(1, Math.floor(height * 0.45)),
  ).data
  let bright = 0
  for (let i = 0; i < sample.length; i += 20) {
    if (sample[i]! + sample[i + 1]! + sample[i + 2]! > 60) bright++
  }
  if (bright < 12) {
    throw new Error(`Poster capture looked empty (${backgroundColor}). Try Download again.`)
  }
}

async function encodeMp4Once(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
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
  const source = new VideoSampleSource({
    codec,
    bitrate: tryCfg.bitrate,
    keyFrameInterval: 1,
    alpha: 'discard',
    fullCodecString: tryCfg.fullCodecString,
    hardwareAcceleration: tryCfg.hardwareAcceleration,
    latencyMode: 'quality',
    contentHint: 'detail',
  })
  output.addVideoTrack(source, { frameRate: FPS })
  await output.start()

  const abort = () => {
    void output.cancel().catch(() => {})
  }
  signal.addEventListener('abort', abort)

  const i420 = new Uint8Array(
    canvas.width * canvas.height + 2 * (canvas.width >> 1) * (canvas.height >> 1),
  )
  const frameCount = Math.max(1, Math.round(clip * FPS))
  try {
    for (let i = 0; i < frameCount; i++) {
      if (signal.aborted) throw new Error('MP4 encoding cancelled.')
      if (primary) await seekVideo(primary, (i / FPS) % Math.max(primary.duration || clip, 0.1))
      paint()
      fillI420(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, i420)
      const sample = new VideoSample(i420.slice(), {
        format: 'I420',
        codedWidth: canvas.width,
        codedHeight: canvas.height,
        timestamp: i / FPS,
        duration: 1 / FPS,
        colorSpace: {
          primaries: 'bt709',
          transfer: 'bt709',
          matrix: 'bt709',
          fullRange: false,
        },
      })
      try {
        await source.add(sample)
      } finally {
        sample.close()
      }
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
  await assertPhoneSafeMp4(blob)
  return blob
}

async function encodeMp4(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  paint: () => void,
  primary: HTMLVideoElement | null,
  clip: number,
  signal: AbortSignal,
) {
  let last: unknown
  for (const tryCfg of AVC_TRIES) {
    try {
      return await encodeMp4Once(canvas, ctx, paint, primary, clip, signal, tryCfg)
    } catch (err) {
      last = err
      if (signal.aborted) throw err
    }
  }
  throw last instanceof Error ? last : new Error('MP4 encoding failed.')
}

function recorderMime() {
  const types = [
    `video/mp4;codecs="${AVC_BASELINE}"`,
    `video/mp4;codecs="${AVC_MAIN}"`,
    'video/mp4;codecs="avc1.42E01E"',
    'video/mp4',
  ]
  return types.find((type) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) ?? ''
}

async function encodeRecorder(
  canvas: HTMLCanvasElement,
  paint: () => void,
  layers: Layer[],
  clip: number,
) {
  const mime = recorderMime()
  if (!mime) throw new Error('This browser cannot record an MP4 from a canvas.')

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
  await Promise.race([stopped, sleep(2500)])
  stream.getTracks().forEach((t) => t.stop())
  canvas.remove()

  const blob = new Blob(chunks, { type: 'video/mp4' })
  await assertPhoneSafeMp4(blob)
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

/**
 * Capture the live poster without moving badge/lanyard layout (that was the cord flash).
 * Only hide videos + strip filters briefly, then composite the foot clip back in.
 */
async function capturePoster(node: HTMLElement, width: number, height: number, backgroundColor: string) {
  const videos = [...node.querySelectorAll('video')]
  const filterRestore: { el: HTMLElement; filter: string }[] = []
  const videoOpacity: { el: HTMLVideoElement; opacity: string }[] = []

  for (const video of videos) {
    videoOpacity.push({ el: video, opacity: video.style.opacity })
    video.style.opacity = '0'
  }
  for (const el of [node, ...node.querySelectorAll<HTMLElement>('*')]) {
    if (getComputedStyle(el).filter === 'none') continue
    filterRestore.push({ el, filter: el.style.filter })
    el.style.filter = 'none'
  }

  await sleep(32)
  try {
    const ratio = width / Math.max(1, node.clientWidth)
    let snap = await toCanvas(node, {
      ...SNAPSHOT,
      pixelRatio: ratio,
      backgroundColor,
    })
    if (snap.width !== width || snap.height !== height) {
      const normalized = document.createElement('canvas')
      normalized.width = width
      normalized.height = height
      const nctx = normalized.getContext('2d', { alpha: false })
      if (!nctx) throw new Error('Could not normalize the poster capture.')
      nctx.fillStyle = backgroundColor
      nctx.fillRect(0, 0, width, height)
      nctx.drawImage(snap, 0, 0, width, height)
      snap = normalized
    }
    assertSnapHasContent(snap, backgroundColor)
    return snap
  } finally {
    for (const { el, filter } of filterRestore) el.style.filter = filter
    for (const { el, opacity } of videoOpacity) el.style.opacity = opacity
  }
}

/** Story / grid card → looping H.264 MP4 phones and laptops can both play. */
export async function exportStoryVideo(node: HTMLElement, opts: StoryExportOptions): Promise<StoryVideoFile> {
  const scale = Math.min(1, MAX_VIDEO_WIDTH / Math.max(1, opts.width))
  const width = even(opts.width * scale)
  const height = even(opts.height * scale)
  const liveVideos = [...node.querySelectorAll('video')]

  if (!node.clientWidth || !node.clientHeight) {
    throw new Error('The poster is not on screen yet — wait a beat and try again.')
  }

  const liveBoxes = liveVideos.map((video) => {
    const media = (video.closest('.foot-frame-media') as HTMLElement | null) ?? video
    return mediaBox(node, media, width, height)
  })

  const scratchVideos: HTMLVideoElement[] = []
  for (const video of liveVideos) {
    scratchVideos.push(await hiddenVideoCopy(video))
  }

  let snap: HTMLCanvasElement
  try {
    snap = await capturePoster(node, width, height, opts.backgroundColor)
  } catch (err) {
    for (const video of scratchVideos) {
      video.pause()
      video.removeAttribute('src')
      video.load()
      video.remove()
    }
    throw err
  }

  const layers = scratchVideos
    .map((video, i) => ({ video, box: liveBoxes[i]! }))
    .filter((layer) => layer.video.videoWidth > 0 && layer.box.w > 1 && layer.box.h > 1)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false, colorSpace: 'srgb', willReadFrequently: true })
  if (!ctx) throw new Error('Could not open a canvas to record.')

  const paint = () => paintFrame(ctx, snap, layers, width, height, opts.backgroundColor)
  const primary = layers[0]?.video ?? null
  const clip = clipSeconds(primary)

  try {
    if (primary) {
      primary.pause()
      primary.loop = true
    }

    let blob: Blob
    try {
      blob = await withTimeout(
        (signal) => encodeMp4(canvas, ctx, paint, primary, clip, signal),
        MP4_BUDGET_MS,
        'MP4 encoding took too long.',
      )
    } catch (err) {
      console.warn('MP4 encoder failed, recording canvas instead.', err)
      blob = await encodeRecorder(canvas, paint, layers, clip)
    }

    return { blob, ext: 'mp4' }
  } finally {
    for (const video of scratchVideos) {
      video.pause()
      video.removeAttribute('src')
      video.load()
      video.remove()
    }
  }
}

/** Always lands a real .mp4 — share sheet when useful, anchor download as the reliable path. */
export async function downloadBlob(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'video/mp4' })

  const saveViaAnchor = () => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    a.type = 'video/mp4'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    window.setTimeout(() => {
      a.remove()
      URL.revokeObjectURL(url)
    }, 8_000)
  }

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean
    share?: (data: ShareData) => Promise<void>
  }

  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (mobile && typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename })
      return
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') {
        console.warn('Share failed, falling back to download.', err)
      }
    }
  }

  saveViaAnchor()
}
