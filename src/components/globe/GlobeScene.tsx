import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import landPoints from './land-points.json'

const vertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-p.xyz);
    gl_Position = projectionMatrix * p;
  }
`
const surface = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 n = normalize(vNormal);
    float rim = pow(1.0 - max(dot(n, normalize(vView)), 0.0), 5.3);
    float light = max(dot(n, normalize(vec3(-0.65, 0.9, 0.6))), 0.0);
    float reflection = pow(max(dot(reflect(normalize(vec3(0.8, -0.5, -1.0)), n), normalize(vView)), 0.0), 10.0);
    vec3 body = mix(vec3(0.004, 0.006, 0.019), vec3(0.035, 0.054, 0.09), light * 0.52);
    vec3 edge = mix(vec3(0.27, 0.07, 0.48), vec3(0.36, 0.88, 1.0), smoothstep(-0.65, 0.7, n.y + n.x * 0.55));
    gl_FragColor = vec4(body + reflection * vec3(0.025, 0.045, 0.08) + edge * rim * 1.55, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
const atmosphere = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  uniform float uStrength;
  void main() {
    vec3 n = normalize(vNormal);
    float rim = pow(1.0 - abs(dot(n, normalize(vView))), 4.0);
    vec3 color = mix(vec3(0.42, 0.13, 0.78), vec3(0.48, 0.94, 1.0), smoothstep(-0.6, 0.65, n.y + n.x * 0.5));
    gl_FragColor = vec4(color, rim * uStrength);
  }
`
const pointVertex = /* glsl */ `
  attribute vec3 color;
  attribute float size;
  varying vec3 vColor;
  varying float vFade;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSurface;
  uniform float uMotion;
  uniform float uSpeed;
  void main() {
    vColor = color;
    float seed = fract(position.x * 12.7 + position.y * 38.1);
    vec3 animated = position;
    float envelope = 1.0;
    vec3 direction = normalize(position);
    vec3 tangent = normalize(cross(direction, vec3(0.21, 1.0, 0.13)));
    float time = uTime * uSpeed;
    if (uMotion > 0.5 && uMotion < 1.5) {
      float age = fract(time / (4.0 + seed * 6.0) + seed);
      float travel = age * (0.65 + seed * 0.5);
      animated = direction * (2.035 + travel) + tangent * sin(age * 4.0 + seed * 30.0) * travel * 0.12;
      envelope = smoothstep(0.0, 0.12, age) * (1.0 - smoothstep(0.62, 1.0, age));
    } else if (uMotion > 1.5 && uMotion < 2.5) {
      animated += tangent * sin(time * (0.15 + seed * 0.2) + seed * 20.0) * 0.09;
      animated += direction * sin(time * 0.21 + seed * 30.0) * 0.035;
    } else if (uMotion > 2.5) {
      animated *= 0.97 + 0.03 * sin(time * (0.5 + seed) + seed * 30.0);
      envelope = 0.45 + 0.55 * pow(0.5 + 0.5 * sin(time * (0.5 + seed) + seed * 30.0), 2.0);
    }
    vec4 p = modelViewMatrix * vec4(animated, 1.0);
    float facing = dot(normalize(normalMatrix * normalize(position)), normalize(-p.xyz));
    vFade = mix(1.0, smoothstep(0.06, 0.4, facing), uSurface) * envelope;
    float pulse = 0.9 + 0.1 * sin(uTime * 0.7 + seed * 40.0);
    gl_PointSize = clamp(size * uPixelRatio * (6.0 / -p.z) * pulse, 1.0, 16.0);
    gl_Position = projectionMatrix * p;
  }
`
const pointFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vFade;
  uniform float uHex;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float r = length(p);
    float glow = exp(-r * r * 25.0);
    float core = 1.0 - smoothstep(0.07, 0.21, r);
    float hex = max(abs(p.x) * 0.866025 + abs(p.y) * 0.5, abs(p.y));
    float outline = smoothstep(0.32, 0.37, hex) * (1.0 - smoothstep(0.38, 0.44, hex));
    float alpha = mix(glow * 0.65 + core * 0.7, outline * 0.8 + glow * 0.18, uHex);
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(vColor, alpha * vFade);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function vector(lon: number, lat: number, radius = 2) {
  const phi = lat * Math.PI / 180, theta = lon * Math.PI / 180
  return new THREE.Vector3(Math.cos(phi) * Math.sin(theta) * radius, Math.sin(phi) * radius, Math.cos(phi) * Math.cos(theta) * radius)
}
// Deterministic detail: identical geography and light distribution on every render.
function random(seed: number) { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n) }
type Field = { positions: Float32Array; colors: Float32Array; sizes: Float32Array }
function field(points: number[], colors: number[], sizes: number[]): Field {
  return { positions: new Float32Array(points), colors: new Float32Array(colors), sizes: new Float32Array(sizes) }
}

function Particles({ data, hex = false, surface = false, motion = 0, speed = 1, reducedMotion, name }: { data: Field; hex?: boolean; surface?: boolean; motion?: number; speed?: number; reducedMotion: boolean; name?: string }) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uHex: { value: hex ? 1 : 0 }, uSurface: { value: surface ? 1 : 0 }, uMotion: { value: motion }, uSpeed: { value: speed }, uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) } }), [hex, surface, motion, speed])
  useFrame((_, delta) => { if (!reducedMotion && material.current) material.current.uniforms.uTime.value += Math.min(delta, .05) })
  return <points name={name} frustumCulled={motion !== 1}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
      <bufferAttribute attach="attributes-size" args={[data.sizes, 1]} />
    </bufferGeometry>
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={pointVertex} fragmentShader={pointFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
  </points>
}

// Radians per second. Each layer has one owner; dragging changes the viewing camera.
const MOTION = { earth: .025, emission: 1, trails: .75, hexagons: .8 }
const ORBITS = [
  { tilt: [-.35, .2, -.25], radius: 2.44, precession: .038, beads: .16 },
  { tilt: [.8, .2, .4], radius: 2.55, precession: -.026, beads: -.11 },
  { tilt: [1.2, -.3, -.7], radius: 2.34, precession: .019, beads: .08 },
] as const

function OrbitalRing({ index, compact, reducedMotion }: { index: number; compact: boolean; reducedMotion: boolean }) {
  const plane = useRef<THREE.Group>(null)
  const beads = useRef<THREE.Group>(null)
  const config = ORBITS[index]
  const data = useMemo(() => {
    const positions: number[] = [], colors: number[] = [], sizes: number[] = [], line: number[] = []
    const count = compact ? 160 : 280
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2, b = (i + 1) / count * Math.PI * 2
      const p = [Math.cos(a) * config.radius, 0, Math.sin(a) * config.radius]
      positions.push(...p)
      const brightness = .28 + random(i + index * 100) * .65
      colors.push(.5 * brightness, .65 * brightness, brightness)
      sizes.push(i % 17 === 0 ? 4.5 : 1.6 + random(i) * 1.2)
      line.push(...p, Math.cos(b) * config.radius, 0, Math.sin(b) * config.radius)
    }
    return { beads: field(positions, colors, sizes), line: new Float32Array(line) }
  }, [compact, config.radius, index])
  useFrame((_, delta) => {
    if (reducedMotion) return
    const dt = Math.min(delta, .05)
    if (plane.current) plane.current.rotation.y += dt * config.precession
    if (beads.current) beads.current.rotation.y += dt * config.beads
  })
  return <group ref={plane} name={`orbit-plane-${index}`} rotation={[...config.tilt]}>
    <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[data.line, 3]} /></bufferGeometry><lineBasicMaterial color={index === 1 ? '#ab82d9' : '#8fb9d8'} transparent opacity={.1} depthWrite={false} /></lineSegments>
    <group ref={beads} name={`orbit-beads-${index}`}><Particles data={data.beads} reducedMotion={reducedMotion} /></group>
  </group>
}

function RadialTrails({ positions, colors, reducedMotion }: { positions: Float32Array; colors: Float32Array; reducedMotion: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  useFrame((_, delta) => { if (!reducedMotion && material.current) material.current.uniforms.uTime.value += Math.min(delta, .05) * MOTION.trails })
  return <lineSegments name="radial-trails">
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /><bufferAttribute attach="attributes-color" args={[colors, 3]} /></bufferGeometry>
    <shaderMaterial ref={material} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending}
      vertexShader={`attribute vec3 color; varying vec3 vColor; varying float vAlpha; uniform float uTime;
        void main() { float seed = fract(dot(normalize(position), vec3(12.7, 31.1, 8.3))); float pulse = sin(uTime * (0.5 + seed) + seed * 30.0);
        vColor = color; vAlpha = 0.35 + 0.3 * (0.5 + 0.5 * pulse);
        float tip = smoothstep(2.03, 2.6, length(position));
        vec3 p = position * (1.0 + tip * pulse * 0.025); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`}
      fragmentShader={`varying vec3 vColor; varying float vAlpha; void main() { gl_FragColor = vec4(vColor, vAlpha); }`} />
  </lineSegments>
}

function GlobeGeometry({ reducedMotion, compact }: { reducedMotion: boolean; compact: boolean }) {
  const earth = useRef<THREE.Group>(null)
  const data = useMemo(() => {
    const positions: number[] = [], colors: number[] = [], sizes: number[] = []
    for (let i = 0; i < landPoints.length / 2; i++) {
      if (compact && i % 3 !== 0) continue
      const lon = landPoints[i * 2], lat = landPoints[i * 2 + 1]
      const noise = random(i), cluster = Math.pow(random(Math.floor(lon / 5) * 31 + Math.floor(lat / 5)), 2)
      const bright = noise > .94 || cluster > .88
      const hotspot = Math.max(
        Math.exp(-(((lon + 85) / 24) ** 2) - ((lat - 39) / 13) ** 2),
        Math.exp(-(((lon - 12) / 20) ** 2) - ((lat - 48) / 12) ** 2),
        Math.exp(-(((lon - 115) / 20) ** 2) - ((lat - 30) / 20) ** 2),
        Math.exp(-(((lon + 46) / 14) ** 2) - ((lat + 23) / 17) ** 2),
      )
      positions.push(...vector(lon + (random(i + 300) - .5) * .4, lat + (random(i + 500) - .5) * .3, 2.012 + noise * .009).toArray())
      const color = new THREE.Color(lat < -18 && lon < -45 ? '#7d80ef' : '#f078d8')
      colors.push(...color.multiplyScalar((bright ? 1.4 : .12 + noise * .45) + hotspot * 1.5).toArray())
      sizes.push(bright ? 2.8 + noise * 1.2 : 1.0 + noise * .7 + hotspot * .9)
    }
    const cloud: number[] = [], cloudColors: number[] = [], cloudSizes: number[] = []
    const beams: number[] = [], beamColors: number[] = []
    const tips: number[] = [], tipColors: number[] = [], tipSizes: number[] = []
    const count = compact ? 100 : 230
    for (let i = 0; i < count; i++) {
      const direction = vector(random(i + 22) * 360 - 180, Math.asin(random(i + 61) * 2 - 1) * 180 / Math.PI, 1)
      const radius = 2.18 + random(i + 83) * .62
      cloud.push(...direction.clone().multiplyScalar(radius).toArray())
      const color = new THREE.Color(i % 5 === 0 ? '#9ee7ff' : '#c783e3')
      cloudColors.push(...color.multiplyScalar(.5 + random(i + 10) * .65).toArray()); cloudSizes.push(5 + random(i + 42) * 7)
      if (i % 2 === 0) {
        const end = radius + .13 + random(i + 45) * .38
        beams.push(...direction.clone().multiplyScalar(2.015).toArray(), ...direction.clone().multiplyScalar(end).toArray())
        beamColors.push(.035, .015, .09, ...new THREE.Color(i % 7 === 0 ? '#89d5ed' : '#9853e0').multiplyScalar(.8).toArray())
        tips.push(...direction.clone().multiplyScalar(end).toArray()); tipColors.push(.8, .65, 1); tipSizes.push(3.2)
      }
    }
    const emission: number[] = [], emissionColors: number[] = [], emissionSizes: number[] = []
    for (let i = 0; i < (compact ? 64 : 180); i++) {
      emission.push(...vector(random(i + 901) * 360 - 180, Math.asin(random(i + 321) * 2 - 1) * 180 / Math.PI, 2.04).toArray())
      emissionColors.push(...new THREE.Color(['#91dcf3', '#d39bf0', '#c37cdb', '#b5d5ff'][i % 4]).multiplyScalar(.5 + random(i) * .7).toArray())
      emissionSizes.push(2 + random(i + 44) * 4)
    }
    const network: number[] = []
    const sphere = new THREE.IcosahedronGeometry(1, 1)
    const wire = new THREE.WireframeGeometry(sphere)
    const edges = wire.getAttribute('position')
    for (let i = 0; i < edges.count; i += 2) {
      const start = new THREE.Vector3().fromBufferAttribute(edges, i)
      const end = new THREE.Vector3().fromBufferAttribute(edges, i + 1)
      for (let step = 0; step < 8; step++) {
        network.push(...start.clone().lerp(end, step / 8).normalize().multiplyScalar(2.032).toArray(), ...start.clone().lerp(end, (step + 1) / 8).normalize().multiplyScalar(2.032).toArray())
      }
    }
    sphere.dispose(); wire.dispose()
    return { land: field(positions, colors, sizes), cloud: field(cloud, cloudColors, cloudSizes), tips: field(tips, tipColors, tipSizes), emission: field(emission, emissionColors, emissionSizes), beams: new Float32Array(beams), beamColors: new Float32Array(beamColors), network: new Float32Array(network) }
  }, [compact])
  useFrame((_, delta) => { if (earth.current && !reducedMotion) earth.current.rotation.y += Math.min(delta, .05) * MOTION.earth })
  return <>
    <group ref={earth} name="earth-rotation">
    <mesh><sphereGeometry args={[2, compact ? 64 : 96, compact ? 48 : 64]} /><shaderMaterial vertexShader={vertex} fragmentShader={surface} /></mesh>
    {[1.017, 1.045].map((scale, i) => <mesh key={scale} scale={scale}><sphereGeometry args={[2, 64, 48]} /><shaderMaterial uniforms={{ uStrength: { value: i ? .16 : .72 } }} vertexShader={vertex} fragmentShader={atmosphere} transparent depthWrite={false} side={THREE.BackSide} blending={THREE.AdditiveBlending} /></mesh>)}
    <Particles data={data.land} surface reducedMotion={reducedMotion} />
    <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[data.network, 3]} /></bufferGeometry><lineBasicMaterial color="#73749b" transparent opacity={.13} depthWrite={false} /></lineSegments>
    </group>
    <RadialTrails positions={data.beams} colors={data.beamColors} reducedMotion={reducedMotion} />
    <Particles data={data.tips} motion={3} speed={MOTION.trails} reducedMotion={reducedMotion} name="trail-tips" />
    <Particles data={data.cloud} hex motion={2} speed={MOTION.hexagons} reducedMotion={reducedMotion} name="hexagon-drift" />
    <Particles data={data.emission} motion={1} speed={MOTION.emission} reducedMotion={reducedMotion} name="outward-emission" />
    {ORBITS.slice(0, compact ? 2 : 3).map((_, index) => <OrbitalRing key={index} index={index} compact={compact} reducedMotion={reducedMotion} />)}
  </>
}

export default function GlobeScene({ reducedMotion }: { reducedMotion: boolean }) {
  const [compact] = useState(() => window.matchMedia('(max-width: 899px)').matches || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4)
  return <Canvas camera={{ position: [0, 0, 6.6], fov: 43 }} dpr={[1, 1.5]} frameloop={reducedMotion ? 'demand' : 'always'} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
    <group rotation={[.13, 1.1, -.08]}><GlobeGeometry reducedMotion={reducedMotion} compact={compact} /></group>
    <OrbitControls enablePan={false} enableZoom={false} enableDamping dampingFactor={.06} rotateSpeed={.55} autoRotate={false} />
  </Canvas>
}
