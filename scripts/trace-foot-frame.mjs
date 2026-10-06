// Traces public/foot-frame-outline.png into the SVG path used to clip the foot video.
// Usage: node scripts/trace-foot-frame.mjs  (prints the path `d` string)
import { chromium } from 'playwright'
import fs from 'fs'

const b64 = fs.readFileSync(new URL('../public/foot-frame-outline.png', import.meta.url)).toString('base64')
const browser = await chromium.launch()
const page = await browser.newPage()
const pts = await page.evaluate(async (b64) => {
  const img = new Image()
  img.src = 'data:image/png;base64,' + b64
  await img.decode()
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const d = ctx.getImageData(0, 0, c.width, c.height).data
  const W = c.width
  const H = c.height
  const ink = (x, y) => {
    x = Math.round(x)
    y = Math.round(y)
    if (x < 0 || y < 0 || x >= W || y >= H) return 0
    const i = (y * W + x) * 4
    const lum = (d[i] + d[i + 1] + d[i + 2]) / 3
    return (d[i + 3] / 255) * (1 - lum / 255)
  }
  const cx = W / 2
  const cy = H / 2
  const out = []
  const N = 1440
  for (let k = 0; k < N; k++) {
    const t = (k / N) * Math.PI * 2
    const dx = Math.cos(t)
    const dy = Math.sin(t)
    let r = Math.hypot(W, H)
    while (r > 0 && ink(cx + dx * r, cy + dy * r) < 0.25) r -= 0.25
    // ink-weighted centre of the stroke along this ray
    let sw = 0
    let sr = 0
    for (let rr = r + 3; rr > r - 6; rr -= 0.125) {
      const v = ink(cx + dx * rr, cy + dy * rr)
      sw += v
      sr += v * rr
    }
    const rc = sw ? sr / sw : r
    out.push([cx + dx * rc, cy + dy * rc])
  }
  return out
}, b64)
await browser.close()

const simplify = (P, eps) => {
  if (P.length < 3) return P
  const a = P[0]
  const b = P[P.length - 1]
  const L = Math.hypot(b[0] - a[0], b[1] - a[1])
  let md = 0
  let mi = 0
  for (let i = 1; i < P.length - 1; i++) {
    const p = P[i]
    const dd = L
      ? Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L
      : Math.hypot(p[0] - a[0], p[1] - a[1])
    if (dd > md) {
      md = dd
      mi = i
    }
  }
  if (md <= eps) return [a, b]
  return [...simplify(P.slice(0, mi + 1), eps).slice(0, -1), ...simplify(P.slice(mi), eps)]
}

// Start on the straight left edge so the closing seam is invisible.
let s = 0
let best = Infinity
pts.forEach((p, i) => {
  const v = Math.abs(p[0]) + Math.abs(p[1] - 284)
  if (v < best) {
    best = v
    s = i
  }
})
const ring = [...pts.slice(s), ...pts.slice(0, s)]
const half = Math.floor(ring.length / 2)
const simp = [
  ...simplify(ring.slice(0, half + 1), 0.2).slice(0, -1),
  ...simplify([...ring.slice(half), ring[0]], 0.2).slice(0, -1),
]

const f = (v) => +v.toFixed(1)
const path = `M ${simp.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L ')} Z`
console.error(`points: ${simp.length}`)
console.log(path)
