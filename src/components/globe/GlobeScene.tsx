import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

type Coordinate = [number, number]
const RADIUS = 2

// Coarse geographic silhouettes keep the scene self-contained and inexpensive to draw.
const landmasses: Coordinate[][] = [
  [[-168,65],[-153,71],[-135,69],[-126,58],[-124,49],[-117,32],[-106,24],[-98,17],[-87,21],[-82,26],[-80,33],[-66,45],[-57,53],[-66,60],[-82,62],[-96,71],[-123,72],[-145,67],[-168,65]],
  [[-82,12],[-72,8],[-61,10],[-50,2],[-47,-10],[-39,-22],[-53,-34],[-70,-55],[-76,-40],[-79,-20],[-82,0],[-82,12]],
  [[-11,36],[-6,43],[-10,54],[0,59],[10,55],[20,60],[31,71],[42,70],[57,61],[76,55],[92,57],[108,51],[120,51],[136,45],[141,37],[130,32],[122,20],[108,13],[99,4],[103,-6],[115,-8],[125,-2],[133,4],[123,14],[112,19],[103,25],[96,22],[88,9],[78,8],[72,20],[62,25],[48,29],[42,40],[32,35],[27,40],[15,39],[7,43],[-2,36],[-11,36]],
  [[-17,35],[-3,37],[12,33],[25,31],[34,24],[42,12],[50,11],[43,-11],[33,-25],[18,-35],[9,-34],[-1,-22],[-9,-4],[-17,14],[-17,35]],
  [[112,-11],[125,-12],[139,-15],[152,-25],[153,-34],[140,-39],[128,-34],[115,-31],[112,-21],[112,-11]],
  [[-52,60],[-42,59],[-38,70],[-44,82],[-56,83],[-61,74],[-52,60]],
  [[47,-13],[50,-17],[49,-25],[45,-26],[43,-17],[47,-13]],
]

const hubs: Coordinate[] = [
  [-122,37],[-74,40],[-99,19],[-46,-23],[-0.1,51],[2,48],[13,52],[28,-26],
  [31,30],[55,25],[73,19],[77,28],[103,1],[114,22],[121,31],[139,35],
  [151,-34],[116,40],[37,55],[-79,43],[-58,-34],[18,59],[100,14],[127,37],
]

const routes: [number, number][] = [[0,1],[1,4],[4,5],[5,6],[6,17],[4,10],[10,11],[11,14],[14,15],[15,16],[12,13],[13,17],[8,9],[1,19],[2,20],[7,8],[18,17],[10,12],[21,6],[22,14],[23,17]]

function toVector([longitude, latitude]: Coordinate, radius = RADIUS) {
  const phi = (90 - latitude) * Math.PI / 180
  const theta = (longitude + 180) * Math.PI / 180
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

function GlobeGeometry({ reducedMotion }: { reducedMotion: boolean }) {
  const particles = useRef<THREE.Points>(null)
  const disposalTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const geography = useMemo(() => landmasses.map((outline) => {
    const points = outline.map((coordinate) => toVector(coordinate, RADIUS + 0.018))
    return new THREE.BufferGeometry().setFromPoints(points)
  }), [])
  const arcGeometry = useMemo(() => routes.map(([from, to]) => {
    const start = toVector(hubs[from], RADIUS + 0.04)
    const end = toVector(hubs[to], RADIUS + 0.04)
    const middle = start.clone().add(end).normalize().multiplyScalar(RADIUS + 0.36)
    return new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(start, middle, end).getPoints(28))
  }), [])
  const landLines = useMemo(() => geography.map((geometry) => new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#39c9ff', transparent: true, opacity: 0.9 }))), [geography])
  const arcs = useMemo(() => arcGeometry.map((geometry) => new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#6cd9ff', transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending }))), [arcGeometry])
  const nodeGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(hubs.map((point) => toVector(point, RADIUS + 0.045))), [])
  const particleGeometry = useMemo(() => {
    const positions = new Float32Array(120 * 3)
    for (let i = 0; i < 120; i++) {
      const y = 1 - (i / 119) * 2
      const angle = i * 2.399963
      const radius = 2.42 + ((i * 37) % 11) / 28
      const spread = Math.sqrt(1 - y * y)
      positions.set([Math.cos(angle) * spread * radius, y * radius, Math.sin(angle) * spread * radius], i * 3)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [])

  useEffect(() => {
    if (disposalTimer.current) clearTimeout(disposalTimer.current)
    return () => {
      // Defer disposal so React Strict Mode's development remount can reuse the geometry.
      disposalTimer.current = setTimeout(() => {
        [...landLines, ...arcs].forEach((line) => { line.geometry.dispose(); line.material.dispose() })
        nodeGeometry.dispose()
        particleGeometry.dispose()
      }, 0)
    }
  }, [landLines, arcs, nodeGeometry, particleGeometry])

  useFrame((_, delta) => {
    if (!reducedMotion && particles.current) particles.current.rotation.y += delta * 0.025
  })

  return (
    <>
      <mesh>
        <sphereGeometry args={[RADIUS, 48, 32]} />
        <meshStandardMaterial color="#071b37" roughness={0.46} metalness={0.34} emissive="#062858" emissiveIntensity={0.28} />
      </mesh>
      <mesh scale={1.055}>
        <sphereGeometry args={[RADIUS, 48, 32]} />
        <shaderMaterial transparent depthWrite={false} side={THREE.BackSide} blending={THREE.AdditiveBlending}
          vertexShader={'varying vec3 vNormal; varying vec3 vView; void main() { vNormal = normalize(normalMatrix * normal); vec4 p = modelViewMatrix * vec4(position, 1.0); vView = normalize(-p.xyz); gl_Position = projectionMatrix * p; }'}
          fragmentShader={'varying vec3 vNormal; varying vec3 vView; void main() { float glow = pow(1.0 - abs(dot(vNormal, vView)), 2.2); gl_FragColor = vec4(0.08, 0.48, 1.0, glow * 0.42); }'} />
      </mesh>
      {landLines.map((line, index) => <primitive key={`land-${index}`} object={line} />)}
      {arcs.map((line, index) => <primitive key={`arc-${index}`} object={line} />)}
      <points geometry={nodeGeometry}><pointsMaterial color="#a1efff" size={0.075} sizeAttenuation transparent opacity={0.95} depthWrite={false} /></points>
      {[0.35, -0.45].map((tilt, index) => <mesh key={index} rotation={[tilt, 0.2, index ? -0.4 : 0.3]}>
        <torusGeometry args={[2.35 + index * 0.18, 0.004, 4, 128]} />
        <meshBasicMaterial color={index ? '#806dff' : '#35bfff'} transparent opacity={0.32} />
      </mesh>)}
      <points ref={particles} geometry={particleGeometry}><pointsMaterial color="#84cfff" size={0.018} sizeAttenuation transparent opacity={0.6} depthWrite={false} /></points>
    </>
  )
}

export default function GlobeScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <Canvas camera={{ position: [0, 0, 6.6], fov: 43 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
      <ambientLight intensity={0.65} color="#6295ff" />
      <directionalLight position={[4, 3, 5]} intensity={2.2} color="#a8ddff" />
      <pointLight position={[-4, -2, 2]} intensity={13} color="#5140d8" distance={9} />
      <group rotation={[0.17, -0.5, 0.1]}><GlobeGeometry reducedMotion={reducedMotion} /></group>
      <OrbitControls enablePan={false} enableZoom={false} enableDamping dampingFactor={0.06} rotateSpeed={0.55} autoRotate={!reducedMotion} autoRotateSpeed={0.45} />
    </Canvas>
  )
}
