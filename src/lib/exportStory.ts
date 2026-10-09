import { toCanvas } from 'html-to-image'
import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  getFirstEncodableVideoCodec,
} from 'mediabunny'
import { footFramePath } from '../components/FootVideoFrame'

export interface StoryExportOptions {
  width: number
  height: number
  backgroundColor: string
}

const FPS = 30
const MIN_SECONDS = 2
const MAX_SECONDS = 6

function even(n: number) {
  const v = Math.max(2, Math.round(n))
  return v % 2 === 0 ? v : v - 1
}

function sleep(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms))
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
    window.setTimeout(finish, 180)
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

function mediaBox(node: HTMLElement, media: HTMLElement, width: number, height: number) {
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

/** 9:16 (or any) story card → MP4, with the foot video still moving. */
export async function exportStoryMp4(node: HTMLElement, opts: StoryExportOptions) {
  const width = even(opts.width)
  const height = even(opts.height)
  const videos = [...node.querySelectorAll('video')]
  const hidden: HTMLVideoElement[] = []

  for (const video of videos) {
    hidden.push(video)
    video.style.opacity = '0'
    await waitForVideo(video)
  }

  await sleep(60)
  const snap = await toCanvas(node, {
    pixelRatio: width / Math.max(1, node.clientWidth),
    cacheBust: true,
    backgroundColor: opts.backgroundColor,
  })

  for (const video of hidden) video.style.opacity = ''

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Could not open a canvas to record.')

  const layers = videos
    .map((video) => {
      const media = (video.closest('.foot-frame-media') as HTMLElement | null) ?? video
      return { video, box: mediaBox(node, media, width, height) }
    })
    .filter((layer) => layer.video.videoWidth > 0)

  const paint = () => {
    ctx.fillStyle = opts.backgroundColor
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

  const format = new Mp4OutputFormat({ fastStart: 'in-memory' })
  const codec = await getFirstEncodableVideoCodec(
    [
      'avc',
      ...format.getSupportedVideoCodecs().filter((c) => c !== 'avc'),
    ],
    {
      width,
      height,
      quality: QUALITY_HIGH,
      frameRate: FPS,
    },
  )
  if (!codec) {
    throw new Error('This browser cannot encode MP4. Try Chrome, Edge, or Safari.')
  }

  const target = new BufferTarget()
  const output = new Output({ format, target })
  const source = new CanvasSource(canvas, {
    codec,
    quality: QUALITY_HIGH,
    keyFrameInterval: 1,
  })
  output.addVideoTrack(source, { frameRate: FPS })
  await output.start()

  const primary = layers[0]?.video ?? null
  const clip =
    primary && Number.isFinite(primary.duration) && primary.duration > 0
      ? Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, primary.duration))
      : MIN_SECONDS
  const frameCount = Math.max(1, Math.round(clip * FPS))
  const wasPlaying = primary ? !primary.paused : false
  const resumeAt = primary?.currentTime ?? 0

  try {
    if (primary) {
      primary.pause()
      primary.loop = true
    }

    for (let i = 0; i < frameCount; i++) {
      if (primary) await seekVideo(primary, (i / FPS) % Math.max(primary.duration || clip, 0.1))
      paint()
      await source.add(i / FPS, 1 / FPS)
    }

    await output.finalize()
  } catch (err) {
    await output.cancel().catch(() => {})
    throw err
  } finally {
    if (primary) {
      primary.currentTime = resumeAt
      if (wasPlaying) void primary.play().catch(() => {})
    }
  }

  const buffer = target.buffer
  if (!buffer) throw new Error('MP4 encoding produced an empty file.')
  return new Blob([buffer], { type: 'video/mp4' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}
