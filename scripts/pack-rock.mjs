import { readFileSync, writeFileSync } from 'node:fs'

const src = process.argv[2]
const dest = process.argv[3]
if (!src || !dest) {
  console.error('usage: node scripts/pack-rock.mjs <in.obj> <out.bin>')
  process.exit(1)
}

const text = readFileSync(src, 'utf8')
const srcPos = []
const srcIdx = []

for (const raw of text.split(/\r?\n/)) {
  if (raw.startsWith('v ')) {
    const parts = raw.trim().split(/\s+/)
    srcPos.push(Number(parts[1]), Number(parts[2]), Number(parts[3]))
    continue
  }
  if (!raw.startsWith('f ')) continue
  const verts = raw
    .trim()
    .split(/\s+/)
    .slice(1)
    .map((tok) => Number.parseInt(tok.split('/')[0], 10) - 1)
  for (let i = 1; i < verts.length - 1; i++) {
    srcIdx.push(verts[0], verts[i], verts[i + 1])
  }
}

const srcCount = srcPos.length / 3
let minX = Infinity
let minY = Infinity
let minZ = Infinity
let maxX = -Infinity
let maxY = -Infinity
let maxZ = -Infinity
for (let i = 0; i < srcCount; i++) {
  const x = srcPos[i * 3]
  const y = srcPos[i * 3 + 1]
  const z = srcPos[i * 3 + 2]
  if (x < minX) minX = x
  if (y < minY) minY = y
  if (z < minZ) minZ = z
  if (x > maxX) maxX = x
  if (y > maxY) maxY = y
  if (z > maxZ) maxZ = z
}

const diag = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ)
const cell = diag / 96

const buckets = new Map()
const remap = new Uint32Array(srcCount)
for (let i = 0; i < srcCount; i++) {
  const x = srcPos[i * 3]
  const y = srcPos[i * 3 + 1]
  const z = srcPos[i * 3 + 2]
  const key = `${Math.round(x / cell)},${Math.round(y / cell)},${Math.round(z / cell)}`
  let b = buckets.get(key)
  if (!b) {
    b = { x: 0, y: 0, z: 0, n: 0, id: buckets.size }
    buckets.set(key, b)
  }
  b.x += x
  b.y += y
  b.z += z
  b.n++
  remap[i] = b.id
}

const positions = new Float32Array(buckets.size * 3)
for (const b of buckets.values()) {
  const i = b.id * 3
  positions[i] = b.x / b.n
  positions[i + 1] = b.y / b.n
  positions[i + 2] = b.z / b.n
}

const seen = new Set()
const indices = []
for (let t = 0; t < srcIdx.length; t += 3) {
  const a = remap[srcIdx[t]]
  const b = remap[srcIdx[t + 1]]
  const c = remap[srcIdx[t + 2]]
  if (a === b || b === c || c === a) continue
  const key = a < b && a < c ? `${a}:${b}:${c}` : b < c ? `${b}:${c}:${a}` : `${c}:${a}:${b}`
  if (seen.has(key)) continue
  seen.add(key)
  indices.push(a, b, c)
}

const vertCount = positions.length / 3
const indexCount = indices.length
if (vertCount > 65535) {
  console.error(`too many verts for uint16: ${vertCount}`)
  process.exit(1)
}

const header = 12
const posBytes = vertCount * 3 * 4
const buf = new ArrayBuffer(header + posBytes + indexCount * 2)
const dv = new DataView(buf)
dv.setUint8(0, 'R'.charCodeAt(0))
dv.setUint8(1, 'O'.charCodeAt(0))
dv.setUint8(2, 'C'.charCodeAt(0))
dv.setUint8(3, 'K'.charCodeAt(0))
dv.setUint32(4, vertCount, true)
dv.setUint32(8, indexCount, true)
new Float32Array(buf, header, vertCount * 3).set(positions)
new Uint16Array(buf, header + posBytes, indexCount).set(indices)

writeFileSync(dest, Buffer.from(buf))
console.log(
  `packed ${srcCount} → ${vertCount} verts, ${srcIdx.length / 3} → ${indexCount / 3} tris, cell=${cell.toFixed(4)} → ${dest} (${buf.byteLength} bytes)`,
)
