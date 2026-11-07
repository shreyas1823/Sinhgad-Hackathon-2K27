import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

let snapshot: string | undefined

// A single real 3D render, retained as an image. No persistent canvas or frame loop.
export function renderTracksSculpture() {
  if (snapshot) return snapshot
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' })
  const scene = new THREE.Scene()
  let environment: THREE.WebGLRenderTarget | undefined
  let pmrem: THREE.PMREMGenerator | undefined
  const room = new RoomEnvironment()
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  try {
    if (renderer.capabilities.maxTextureSize < 2048) throw new Error('Use lightweight artwork')
    renderer.setSize(512, 512)
    renderer.setPixelRatio(1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    pmrem = new THREE.PMREMGenerator(renderer)
    environment = pmrem.fromScene(room, 0.04)
    scene.environment = environment.texture
    scene.environmentIntensity = 0.7

    const camera = new THREE.OrthographicCamera(-2.55, 2.55, 2.55, -2.55, 0.1, 30)
    camera.position.set(5, 4.5, 6)
    camera.lookAt(0, 0, 0)
    scene.add(new THREE.HemisphereLight('#b9dfff', '#17132c', 1.4))
    const key = new THREE.DirectionalLight('#ecf5ff', 4)
    key.position.set(-3, 6, 4)
    key.castShadow = true
    key.shadow.mapSize.set(512, 512)
    key.shadow.camera.left = key.shadow.camera.bottom = -4
    key.shadow.camera.right = key.shadow.camera.top = 4
    key.shadow.normalBias = 0.035
    key.shadow.radius = 3
    scene.add(key)
    const rim = new THREE.DirectionalLight('#9671ff', 3)
    rim.position.set(3, 2, -3)
    scene.add(rim)

    const material = (color: string, metalness: number, roughness: number) => {
      const value = new THREE.MeshStandardMaterial({ color, metalness, roughness })
      materials.add(value)
      return value
    }
    const blue = material('#657dff', 0.65, 0.23)
    const violet = material('#8770d9', 0.55, 0.25)
    const silver = material('#c4d2e6', 0.85, 0.2)
    const white = material('#e7efff', 0.2, 0.28)
    const group = new THREE.Group()
    group.rotation.y = -0.2
    scene.add(group)
    const add = (geometry: THREE.BufferGeometry, surface: THREE.Material, position: [number, number, number]) => {
      geometries.add(geometry)
      const mesh = new THREE.Mesh(geometry, surface)
      mesh.position.set(...position)
      mesh.castShadow = mesh.receiveShadow = true
      group.add(mesh)
      return mesh
    }
    const plate = (size: number) => {
      const shape = new THREE.Shape()
      const half = size / 2
      shape.moveTo(-half, -half)
      shape.lineTo(half, -half)
      shape.lineTo(half, half)
      shape.lineTo(-half, half)
      shape.closePath()
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.06, bevelThickness: 0.04 })
      geometry.rotateX(-Math.PI / 2)
      return geometry
    }
    add(plate(2.5), blue, [0, -1, 0]).rotation.y = -0.15
    add(plate(2.05), silver, [0.05, -0.55, 0]).rotation.y = 0.32
    const ring = new THREE.Shape()
    ring.absarc(0, 0, 0.87, 0, Math.PI * 2, false)
    const hole = new THREE.Path()
    hole.absarc(0, 0, 0.48, 0, Math.PI * 2, true)
    ring.holes.push(hole)
    const ringGeometry = new THREE.ExtrudeGeometry(ring, { depth: 0.18, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.035, bevelThickness: 0.035, curveSegments: 40 })
    ringGeometry.rotateX(-Math.PI / 2)
    add(ringGeometry, violet, [0.18, 0, 0.04])
    add(new THREE.CylinderGeometry(0.83, 0.83, 0.22, 3), white, [0.22, 0.72, 0]).rotation.y = -0.3
    add(new THREE.SphereGeometry(0.35, 24, 16), silver, [-0.83, 0.43, 0.6])
    add(new THREE.BoxGeometry(0.38, 0.38, 0.38), blue, [1.03, 0.37, -0.33]).rotation.set(0.2, 0.3, 0.1)

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ color: '#020611', opacity: 0.45 }))
    geometries.add(floor.geometry)
    materials.add(floor.material)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.14
    floor.receiveShadow = true
    scene.add(floor)
    renderer.render(scene, camera)
    snapshot = renderer.domElement.toDataURL('image/png')
    return snapshot
  } finally {
    geometries.forEach((geometry) => geometry.dispose())
    materials.forEach((surface) => surface.dispose())
    keyShadowCleanup(scene)
    environment?.dispose()
    pmrem?.dispose()
    room.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }
}

function keyShadowCleanup(scene: THREE.Scene) {
  scene.traverse((object) => { if (object instanceof THREE.DirectionalLight) object.shadow.dispose() })
}
