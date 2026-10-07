import { Component, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
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
  { position: [0.08, 0, 0], rotation: [0.06, 0.55, 0.03], scale: 1 },
  { position: [0.72, 0, 0.18], rotation: [0.04, -0.85, -0.02], scale: 0.62 },
  { position: [-0.22, 0, 0.42], rotation: [0.05, 1.35, 0.04], scale: 0.46 },
]

const RIGHT_PILE: RockPose[] = [
  { position: [-0.06, 0, 0], rotation: [0.05, -0.62, -0.03], scale: 1 },
  { position: [-0.74, 0, 0.16], rotation: [0.04, 0.9, 0.02], scale: 0.6 },
  { position: [0.2, 0, 0.44], rotation: [0.06, -1.25, 0.03], scale: 0.48 },
]

function Pile({ poses }: { poses: RockPose[] }) {
  const geometry = useRockGeometry()
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#7a7368',
        roughness: 0.91,
        metalness: 0.05,
      }),
    [],
  )
  if (!geometry?.boundingBox) return null

  const y0 = -geometry.boundingBox.min.y
  return (
    <group>
      {poses.map((pose, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={material}
          position={[pose.position[0], y0 * pose.scale, pose.position[2]]}
          rotation={pose.rotation}
          scale={pose.scale}
        />
      ))}
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

function CornerCanvas({
  side,
  poses,
}: {
  side: 'left' | 'right'
  poses: RockPose[]
}) {
  const camX = side === 'left' ? 2.15 : -2.15
  return (
    <div
      className={`pointer-events-none absolute bottom-0 z-[-1] h-[150px] w-[160px] overflow-hidden sm:h-[230px] sm:w-[250px] md:h-[260px] md:w-[280px] ${
        side === 'left' ? 'left-0' : 'right-0'
      }`}
      aria-hidden
    >
      <WebGLGate>
        <Canvas
          orthographic
          camera={{ position: [camX, 3.1, 5.2], zoom: 56, near: 0.1, far: 40 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
          }}
          onCreated={({ gl, camera }) => {
            gl.setClearColor(0x000000, 0)
            camera.lookAt(0.05 * (side === 'left' ? -1 : 1), 0.05, 0)
          }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.78} />
          <hemisphereLight args={['#f3eee6', '#9a948a', 0.65]} />
          <directionalLight position={[2.4, 4, 2.4]} intensity={1.3} color="#fff4e4" />
          <directionalLight position={[-1.8, 1, 1.4]} intensity={0.36} color="#d7e0f2" />
          <group position={[side === 'left' ? -0.15 : 0.15, -0.95, 0]} scale={0.82}>
            <Pile poses={poses} />
          </group>
        </Canvas>
      </WebGLGate>
    </div>
  )
}

/** A few of the uploaded rocks, sitting in the bottom corners of the page. */
export function CornerRocks() {
  return (
    <>
      <CornerCanvas side="left" poses={LEFT_PILE} />
      <CornerCanvas side="right" poses={RIGHT_PILE} />
    </>
  )
}
