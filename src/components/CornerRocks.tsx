import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const ROCK_URL = `${import.meta.env.BASE_URL}rock.bin`

let rockGeoPromise: Promise<THREE.BufferGeometry> | null = null

function parseRockBin(buf: ArrayBuffer) {
  const dv = new DataView(buf)
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3))
  if (magic !== 'ROCK') throw new Error('Invalid rock mesh')
  const vertCount = dv.getUint32(4, true)
  const indexCount = dv.getUint32(8, true)
  const pos = new Float32Array(buf, 12, vertCount * 3)
  const indices = new Uint16Array(buf, 12 + vertCount * 3 * 4, indexCount)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setIndex(new THREE.BufferAttribute(indices, 1))
  geo.computeVertexNormals()
  geo.center()
  geo.computeBoundingBox()
  geo.computeBoundingSphere()
  return geo
}

function loadRockGeometry() {
  if (!rockGeoPromise) {
    rockGeoPromise = fetch(ROCK_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load rock (${res.status})`)
        return res.arrayBuffer()
      })
      .then(parseRockBin)
  }
  return rockGeoPromise
}

function useRockGeometry() {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null)
  useEffect(() => {
    let alive = true
    loadRockGeometry()
      .then((g) => {
        if (alive) setGeo(g)
      })
      .catch(() => {
        if (alive) setGeo(null)
      })
    return () => {
      alive = false
    }
  }, [])
  return geo
}

type RockPose = {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
}

const LEFT_PILE: RockPose[] = [
  { position: [0.08, 0, 0.06], rotation: [0.16, 0.52, 0.1], scale: 1 },
  { position: [0.78, 0, -0.28], rotation: [0.46, -0.95, 0.2], scale: 0.6 },
  { position: [-0.62, 0, 0.36], rotation: [-0.18, 1.28, -0.24], scale: 0.42 },
]

const RIGHT_PILE: RockPose[] = [
  { position: [-0.06, 0, 0.08], rotation: [0.2, -0.58, -0.12], scale: 1 },
  { position: [-0.82, 0, -0.22], rotation: [0.48, 0.88, -0.14], scale: 0.56 },
  { position: [0.55, 0, 0.4], rotation: [-0.22, -1.18, 0.26], scale: 0.46 },
]

function stoneMaterial() {
  return new THREE.MeshStandardMaterial({
    color: '#9a9184',
    roughness: 0.9,
    metalness: 0.05,
  })
}

function RockMesh({
  geometry,
  pose,
  material,
}: {
  geometry: THREE.BufferGeometry
  pose: RockPose
  material: THREE.MeshStandardMaterial
}) {
  const box = geometry.boundingBox!
  const y = -box.min.y * pose.scale
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[pose.position[0], y + pose.position[1], pose.position[2]]}
      rotation={pose.rotation}
      scale={pose.scale}
    />
  )
}

function ShadowDisk({ pose, geometry }: { pose: RockPose; geometry: THREE.BufferGeometry }) {
  const box = geometry.boundingBox!
  const rx = (box.max.x - box.min.x) * pose.scale * 0.4
  const rz = (box.max.z - box.min.z) * pose.scale * 0.36
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[pose.position[0], 0.012, pose.position[2]]}
      scale={[rx, rz, 1]}
    >
      <circleGeometry args={[1, 18]} />
      <meshBasicMaterial color="#1a1814" transparent opacity={0.13} depthWrite={false} />
    </mesh>
  )
}

function Pile({
  geometry,
  poses,
  sway,
  material,
}: {
  geometry: THREE.BufferGeometry
  poses: RockPose[]
  sway: 1 | -1
  material: THREE.MeshStandardMaterial
}) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.28) * 0.04 * sway
  })
  return (
    <group ref={group}>
      {poses.map((pose, i) => (
        <ShadowDisk key={`s${i}`} pose={pose} geometry={geometry} />
      ))}
      {poses.map((pose, i) => (
        <RockMesh key={i} geometry={geometry} pose={pose} material={material} />
      ))}
    </group>
  )
}

function CornerPiles() {
  const geometry = useRockGeometry()
  const { viewport } = useThree()
  const material = useMemo(() => stoneMaterial(), [])
  if (!geometry) return null

  const pileScale = Math.min(1.05, Math.max(0.72, viewport.width / 14))
  const inset = 1.15 * pileScale
  const x = Math.max(viewport.width / 2 - inset, inset)

  return (
    <group position={[0, -0.85, 0]} scale={pileScale}>
      <group position={[-x / pileScale, 0, 0]}>
        <Pile geometry={geometry} poses={LEFT_PILE} sway={1} material={material} />
      </group>
      <group position={[x / pileScale, 0, 0]}>
        <Pile geometry={geometry} poses={RIGHT_PILE} sway={-1} material={material} />
      </group>
    </group>
  )
}

class WebGLGate extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.setState({ failed: true })
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** A few of the uploaded rocks, sitting in the bottom corners of the page. */
export function CornerRocks() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[12] h-[min(38vw,280px)]"
      aria-hidden
    >
      <WebGLGate>
        <Canvas
          orthographic
          camera={{ position: [0, 1.45, 8], zoom: 82, near: 0.1, far: 40 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
          }}
          onCreated={({ gl, camera }) => {
            gl.setClearColor(0x000000, 0)
            camera.lookAt(0, 0, 0)
          }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.72} />
          <hemisphereLight args={['#f4f1ea', '#b9b3a8', 0.8]} />
          <directionalLight position={[2.6, 3.8, 2.4]} intensity={1.4} color="#fff6e8" />
          <directionalLight position={[-2, 1.1, 1.6]} intensity={0.42} color="#dce6ff" />
          <CornerPiles />
        </Canvas>
      </WebGLGate>
    </div>
  )
}
