import { Component, Suspense, useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CORDS, type CordId } from '../lib/badge'

function makeRopeTexture(from: string, to: string) {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 128, 0)
  g.addColorStop(0, to)
  g.addColorStop(0.45, from)
  g.addColorStop(1, to)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  for (let i = -128; i < 256; i += 6) {
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'
    ctx.lineWidth = 2.8
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + 64, 128)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.32)'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(i + 3, 0)
    ctx.lineTo(i + 67, 128)
    ctx.stroke()
  }
  for (let i = 0; i < 128; i += 5) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    ctx.fillRect(0, i, 128, 2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2.5, 12)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function RopeStrand({
  points,
  radius,
  from,
  to,
}: {
  points: THREE.Vector3[]
  radius: number
  from: string
  to: string
}) {
  const { geo, mat } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.35)
    const tex = makeRopeTexture(from, to)
    const geo = new THREE.TubeGeometry(curve, 72, radius, 14, false)
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.72,
      metalness: 0.05,
    })
    return { geo, mat }
  }, [points, radius, from, to])

  return <mesh geometry={geo} material={mat} />
}

function MetalClip() {
  const chrome = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d8d8d8',
        metalness: 0.95,
        roughness: 0.22,
      }),
    [],
  )
  const dark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#6a6a6a',
        metalness: 0.9,
        roughness: 0.35,
      }),
    [],
  )

  return (
    <group position={[0, -1.08, 0]} scale={1.2}>
      <mesh material={chrome} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.028, 12, 28]} />
      </mesh>
      <mesh material={chrome} position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.12, 12]} />
      </mesh>
      <mesh material={chrome} position={[0, -0.38, 0]}>
        <capsuleGeometry args={[0.055, 0.16, 6, 12]} />
      </mesh>
      <mesh material={dark} position={[0.04, -0.52, 0]} rotation={[0, 0, -0.4]}>
        <torusGeometry args={[0.07, 0.018, 8, 16, Math.PI * 1.2]} />
      </mesh>
      <mesh material={chrome} position={[0, -0.08, 0]}>
        <boxGeometry args={[0.2, 0.06, 0.12]} />
      </mesh>
    </group>
  )
}

function RopeLanyardScene({ from, to }: { from: string; to: string }) {
  const group = useRef<THREE.Group>(null)
  const left = useMemo(
    () => [
      new THREE.Vector3(-1.25, 1.65, 0.05),
      new THREE.Vector3(-1.0, 0.95, 0.08),
      new THREE.Vector3(-0.6, 0.2, 0.02),
      new THREE.Vector3(-0.14, -0.82, 0),
      new THREE.Vector3(0, -0.98, 0),
    ],
    [],
  )
  const right = useMemo(
    () => [
      new THREE.Vector3(1.25, 1.65, -0.05),
      new THREE.Vector3(1.0, 0.95, -0.08),
      new THREE.Vector3(0.6, 0.2, -0.02),
      new THREE.Vector3(0.14, -0.82, 0),
      new THREE.Vector3(0, -0.98, 0),
    ],
    [],
  )

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    group.current.rotation.y = Math.sin(t * 0.85) * 0.05
    group.current.rotation.z = Math.sin(t * 0.55) * 0.02
  })

  return (
    <group ref={group} rotation={[0.12, 0, 0]} position={[0, 0.05, 0]}>
      <RopeStrand points={left} radius={0.145} from={from} to={to} />
      <RopeStrand points={right} radius={0.145} from={from} to={to} />
      <mesh position={[0, -0.9, 0]} rotation={[0.25, 0, 0]}>
        <torusGeometry args={[0.155, 0.065, 10, 18]} />
        <meshStandardMaterial color={from} roughness={0.7} metalness={0.05} />
      </mesh>
      <MetalClip />
    </group>
  )
}

class WebGLGate extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.setState({ failed: true })
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Flat woven fallback if WebGL is unavailable. */
function RopeFallback({ from, to, w, h }: { from: string; to: string; w: number; h: number }) {
  const id = `fb-${from.replace('#', '')}`
  return (
    <svg width={w} height={h} viewBox="0 0 320 240" aria-hidden>
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={to} />
          <stop offset="50%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <pattern id={`p-${id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="8" height="8" fill={`url(#g-${id})`} />
          <path d="M0 0 H8" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
          <path d="M0 4 H8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
        </pattern>
      </defs>
      <path
        d="M70 8 C55 90, 95 150, 155 200 L145 205 C95 155, 65 90, 85 8 Z"
        fill={`url(#p-${id})`}
      />
      <path
        d="M250 8 C265 90, 225 150, 165 200 L175 205 C225 155, 255 90, 235 8 Z"
        fill={`url(#p-${id})`}
      />
      <ellipse cx="160" cy="208" rx="14" ry="10" fill="none" stroke="#cfcfcf" strokeWidth="5" />
      <rect x="152" y="214" width="16" height="14" rx="2" fill="#bdbdbd" />
      <path
        d="M156 226 V236 C156 242 160 245 160 245 C160 245 164 242 164 236 V226"
        stroke="#b0b0b0"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface LanyardProps {
  cord: CordId
  scale?: number
}

/** Big Three.js woven-rope Y-lanyard + metal clasp. */
export function Lanyard({ cord, scale = 1 }: LanyardProps) {
  const { from, to } = CORDS[cord]
  const w = 380 * scale
  const h = 280 * scale
  const fallback = <RopeFallback from={from} to={to} w={w} h={h} />

  return (
    <div
      className="pointer-events-none relative -mb-4"
      style={{ width: w, height: h }}
      aria-hidden
    >
      <WebGLGate fallback={fallback}>
        <Canvas
          orthographic
          camera={{ position: [0, 0.02, 4], zoom: 108 * scale, near: 0.1, far: 20 }}
          dpr={[1, 1.75]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
          }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.95} />
          <directionalLight position={[2.8, 4.2, 3]} intensity={1.5} />
          <directionalLight position={[-2.4, 1.4, 2]} intensity={0.55} color="#fff2d8" />
          <hemisphereLight args={['#ffffff', '#c8ccd4', 0.6]} />
          <Suspense fallback={null}>
            <RopeLanyardScene from={from} to={to} />
          </Suspense>
        </Canvas>
      </WebGLGate>
    </div>
  )
}

export function CordSwatch({ cord }: { cord: CordId }) {
  const { from, to } = CORDS[cord]
  return (
    <svg width="40" height="48" viewBox="0 0 40 48" aria-hidden>
      <defs>
        <linearGradient id={`sw-${cord}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <pattern id={`wv-${cord}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 0 L4 4" stroke="rgba(0,0,0,0.22)" strokeWidth="0.9" />
          <path d="M0 4 L4 0" stroke="rgba(255,255,255,0.28)" strokeWidth="0.7" />
        </pattern>
      </defs>
      <path
        d="M7 2 C5 18, 12 26, 20 36 L15 37 C9 26, 5 18, 9 2 Z"
        fill={`url(#sw-${cord})`}
      />
      <path
        d="M33 2 C35 18, 28 26, 20 36 L25 37 C31 26, 35 18, 31 2 Z"
        fill={`url(#sw-${cord})`}
      />
      <path d="M7 2 C5 18, 12 26, 20 36 L15 37 C9 26, 5 18, 9 2 Z" fill={`url(#wv-${cord})`} />
      <path d="M33 2 C35 18, 28 26, 20 36 L25 37 C31 26, 35 18, 31 2 Z" fill={`url(#wv-${cord})`} />
      <circle cx="20" cy="38" r="3.2" fill="none" stroke="#c8c8c8" strokeWidth="2" />
      <rect x="17" y="40" width="6" height="5.5" rx="0.9" fill="#bdbdbd" />
    </svg>
  )
}
