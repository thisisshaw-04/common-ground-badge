import { toCanvas } from 'html-to-image'
import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  getFirstEncodableAudioCodec,
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
const MP4_BUDGET_MS = 32000

type Box = { x: number; y: number; w: number; h: number }
type Layer = { video: HTMLVideoElement; box: Box }

/** Constrained Baseline 3.1 — iPhone, Android, IG, LinkedIn, VLC. */
const AVC_BASELINE = 'avc1.42E01F'
const AVC_MAIN = 'avc1.4D401F'
const AVC_BITRATE = 2_500_000
const AAC_RATE = 44100

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

function copyCanvases(from: HTMLElement, to: HTMLElement) {
  const src = [...from.querySelectorAll('canvas')]
  const dst = [...to.querySelectorAll('canvas')]
  src.forEach((source, i) => {
    const target = dst[i]
    if (!target) return
    target.width = source.width
    target.height = source.height
    target.getContext('2d')?.drawImage(source, 0, 0)
  })
}

/** Off-screen copy of the poster so the live preview never jumps. */
function mountClone(node: HTMLElement) {
  const clone = node.cloneNode(true) as HTMLElement
  copyCanvases(node, clone)
  for (const video of clone.querySelectorAll('video')) {
    video.remove()
  }
  for (const el of [clone, ...clone.querySelectorAll<HTMLElement>('*')]) {
    if (getComputedStyle(el).filter !== 'none') el.style.filter = 'none'
  }
  clone.style.cssText = [
    'position:fixed',
    'left:-14000px',
    'top:0',
    `width:${node.clientWidth}px`,
    `height:${node.clientHeight}px`,
    'margin:0',
    'pointer-events:none',
    'z-index:-1',
  ].join(';')
  document.body.appendChild(clone)
  return clone
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
  copy.style.cssText = 'position:fixed;left:-9999px;width:2px;height:2px;opacity:0;pointer-events:none'
  document.body.appendChild(copy)
  await waitForVideo(copy)
  return copy
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

function findAvcC(buf: Uint8Array) {
  for (let i = 0; i < buf.length - 8; i++) {
    if (buf[i] === 0x61 && buf[i + 1] === 0x76 && buf[i + 2] === 0x63 && buf[i + 3] === 0x43) {
      return i
    }
  }
  return -1
}

/** Baseline / Main / High 8-bit 4:2:0. High 4:4:4 (0xF4) will not play on phones. */
function phoneSafeAvcProfile(profile: number) {
  return profile === 0x42 || profile === 0x4d || profile === 0x64
}

async function assertPhoneSafeMp4(blob: Blob) {
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
  { fullCodecString: AVC_MAIN, hardwareAcceleration: 'no-preference', bitrate: 2_000_000 },
]

function clipSeconds(primary: HTMLVideoElement | null) {
  if (primary && Number.isFinite(primary.duration) && primary.duration > 0) {
    return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, primary.duration))
  }
  return MIN_SECONDS
}

function silentAudio(seconds: number) {
  const frames = Math.max(AAC_RATE, Math.ceil(AAC_RATE * seconds))
  const ctx = new OfflineAudioContext(2, frames, AAC_RATE)
  return ctx.createBuffer(2, frames, AAC_RATE)
}

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
    keyFrameInterval: 1,
    alpha: 'discard',
    fullCodecString: tryCfg.fullCodecString,
    hardwareAcceleration: tryCfg.hardwareAcceleration,
    latencyMode: 'quality',
    contentHint: 'detail',
  })
  output.addVideoTrack(source, { frameRate: FPS })

  const audioCodec = await getFirstEncodableAudioCodec(['aac'], {
    numberOfChannels: 2,
    sampleRate: AAC_RATE,
    bitrate: 64_000,
  })
  let audio: AudioBufferSource | null = null
  if (audioCodec) {
    audio = new AudioBufferSource({ codec: audioCodec, bitrate: 64_000 })
    output.addAudioTrack(audio)
  }

  await output.start()
  if (audio) await audio.add(silentAudio(clip))

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
  await assertPhoneSafeMp4(blob)
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
  await Promise.race([stopped, sleep(2000)])
  stream.getTracks().forEach((t) => t.stop())
  canvas.remove()

  const blob = new Blob(chunks, { type: 'video/mp4' })
  if (blob.size < 64) throw new Error('Video recording produced an empty file.')
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

/** Story / grid card → looping H.264 MP4 phones and laptops can both play. */
export async function exportStoryVideo(node: HTMLElement, opts: StoryExportOptions): Promise<StoryVideoFile> {
  const scale = Math.min(1, MAX_VIDEO_WIDTH / Math.max(1, opts.width))
  const width = even(opts.width * scale)
  const height = even(opts.height * scale)
  const liveVideos = [...node.querySelectorAll('video')]

  if (!node.clientWidth || !node.clientHeight) {
    throw new Error('The poster is not on screen yet — wait a beat and try again.')
  }

  const fit = node.querySelector('[data-story-fit]') as HTMLElement | null
  const lan = fit?.querySelector('.lanyard-hang') as HTMLElement | null
  const fitBox = fit ? mediaBox(node, fit, width, height) : null
  const lanBox = lan ? mediaBox(node, lan, width, height) : null
  const badgeBox = fitBox && lanBox ? unionBox(fitBox, lanBox) : fitBox
  const ratio = width / Math.max(1, node.clientWidth)

  const clones: HTMLElement[] = []
  const scratchVideos: HTMLVideoElement[] = []
  let bgSnap: HTMLCanvasElement
  let badgeSnap: HTMLCanvasElement | null = null

  try {
    const posterClone = mountClone(node)
    clones.push(posterClone)
    await sleep(30)

    bgSnap = await toCanvas(posterClone, {
      ...SNAPSHOT,
      pixelRatio: ratio,
      backgroundColor: opts.backgroundColor,
      filter: (el) => !el.hasAttribute('data-story-fit'),
    })

    const fitClone = posterClone.querySelector('[data-story-fit]') as HTMLElement | null
    if (fitClone) {
      const lanClone = fitClone.querySelector('.lanyard-hang') as HTMLElement | null
      fitClone.style.transform = 'none'
      fitClone.style.left = '0px'
      fitClone.style.top = '0px'
      fitClone.style.position = 'relative'
      if (lanClone) {
        lanClone.style.position = 'relative'
        lanClone.style.left = 'auto'
        lanClone.style.bottom = 'auto'
        lanClone.style.transform = 'none'
        lanClone.style.marginLeft = 'auto'
        lanClone.style.marginRight = 'auto'
      }
      await sleep(30)
      badgeSnap = await toCanvas(fitClone, {
        ...SNAPSHOT,
        pixelRatio: badgeBox ? badgeBox.w / Math.max(1, fitClone.offsetWidth) : ratio,
      })
    }

    for (const video of liveVideos) {
      const copy = await hiddenVideoCopy(video)
      scratchVideos.push(copy)
    }
  } finally {
    for (const el of clones) el.remove()
  }

  const layers = scratchVideos
    .map((video, i) => {
      const original = liveVideos[i]
      const media =
        (original?.closest('.foot-frame-media') as HTMLElement | null) ?? original ?? video
      return { video, box: mediaBox(node, media, width, height) }
    })
    .filter((layer) => layer.video.videoWidth > 0)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false, colorSpace: 'srgb' })
  if (!ctx) throw new Error('Could not open a canvas to record.')

  const paint = () =>
    paintFrame(ctx, bgSnap, badgeSnap, badgeBox, layers, width, height, opts.backgroundColor)
  const primary = layers[0]?.video ?? null
  const clip = clipSeconds(primary)

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

export async function downloadBlob(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type || 'video/mp4' })
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean
    share?: (data: ShareData) => Promise<void>
  }
  if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename })
      return
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.type = file.type
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  window.setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(url)
  }, 4000)
}
