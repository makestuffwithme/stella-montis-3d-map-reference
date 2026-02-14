/// <reference types="vite/client" />
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import './style.css'

// Scene setup
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a1a)

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.getElementById('app')!.appendChild(renderer.domElement)

const mouse = new THREE.Vector2()

// --- Lighting: rim (edges pop) only ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.25)
scene.add(ambientLight)

const keyLight = new THREE.DirectionalLight(0xffffff, 0.5)
keyLight.position.set(8, 10, 6)
scene.add(keyLight)

const fillLight = new THREE.DirectionalLight(0x88ccff, 0.2)
fillLight.position.set(-12, 5, 5)
scene.add(fillLight)

const rimLight = new THREE.DirectionalLight(0xffffff, 1.4)
rimLight.position.set(0, 8, 12)
scene.add(rimLight)

const keys: Record<string, boolean> = {}
const moveSpeed = 0.04
const sprintMultiplier = 1.8

// Initialize camera position
camera.position.set(-1.23, 23.44, 50.22)

const cameraRotation = {
  yaw: Math.atan2(0, 1),
  pitch: Math.asin(-0.5),
}

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true
})

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false
})

// Mouse look - left click to capture (pointer lock), left click again to release
const mouseLook = {
  lastX: 0,
  lastY: 0,
}

const invertMouseCheckbox = document.getElementById('invert-mouse') as HTMLInputElement | null
let invertMouse = false
if (invertMouseCheckbox) {
  const invertMouseKey = 'stella-montis-invert-mouse'
  invertMouse = localStorage.getItem(invertMouseKey) === 'true'
  invertMouseCheckbox.checked = invertMouse
  invertMouseCheckbox.addEventListener('change', () => {
    invertMouse = invertMouseCheckbox.checked
    localStorage.setItem(invertMouseKey, String(invertMouse))
  })
}
function getMouseLookSign(): number {
  return invertMouse ? 1 : -1
}

document.addEventListener('contextmenu', (e) => {
  e.preventDefault()
})

// Left click on canvas: request pointer lock to enable mouselook; click again to release
renderer.domElement.addEventListener('click', () => {
  if (document.pointerLockElement === renderer.domElement) {
    document.exitPointerLock()
  } else {
    renderer.domElement.requestPointerLock()
  }
})

document.addEventListener('mousemove', (event) => {
  const isPointerLocked = document.pointerLockElement === renderer.domElement

  if (isPointerLocked) {
    // Use movementX/movementY (deltas) while pointer is locked - no drift, infinite rotation
    const sensitivity = 0.002
    const pitchSign = getMouseLookSign() // invert applies only to up/down
    cameraRotation.yaw += event.movementX * sensitivity * -1
    cameraRotation.pitch += event.movementY * sensitivity * pitchSign
    cameraRotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.pitch))
    const euler = new THREE.Euler(cameraRotation.pitch, cameraRotation.yaw, 0, 'YXZ')
    camera.quaternion.setFromEuler(euler)
  } else {
    // Update mouse position for raycasting only when not locked
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    mouseLook.lastX = event.clientX
    mouseLook.lastY = event.clientY
  }
})

// Edge lines: always on, only crease edges (wall/ceiling, etc.)
const edgeLineParams = {
  angleDeg: 1,
  color: 0x1c1c1c,
  opacity: 0.9,
}
const edgeLineMaterial = new THREE.LineBasicMaterial({
  color: edgeLineParams.color,
  opacity: edgeLineParams.opacity,
  transparent: true,
  depthTest: true,
  depthWrite: false,
})
const wireframeOverlayGroup = new THREE.Group()
scene.add(wireframeOverlayGroup)
const wireframeOverlayMeshes: THREE.LineSegments[] = []
let loadedModel: THREE.Group | null = null

function rebuildEdgeLines() {
  if (!loadedModel) return
  wireframeOverlayMeshes.length = 0
  while (wireframeOverlayGroup.children.length) {
    const c = wireframeOverlayGroup.children[0]
    wireframeOverlayGroup.remove(c)
    if (c instanceof THREE.LineSegments && c.geometry) c.geometry.dispose()
  }
  const _wPos = new THREE.Vector3()
  const _wQuat = new THREE.Quaternion()
  const _wScale = new THREE.Vector3()
  loadedModel.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      child.getWorldPosition(_wPos)
      child.getWorldQuaternion(_wQuat)
      child.getWorldScale(_wScale)
      const edgesGeom = new THREE.EdgesGeometry(child.geometry, edgeLineParams.angleDeg)
      const lineSegments = new THREE.LineSegments(edgesGeom, edgeLineMaterial)
      lineSegments.position.copy(_wPos)
      lineSegments.quaternion.copy(_wQuat)
      lineSegments.scale.copy(_wScale)
      lineSegments.renderOrder = 1
      wireframeOverlayGroup.add(lineSegments)
      wireframeOverlayMeshes.push(lineSegments)
    }
  })
}

// Load model
const loader = new GLTFLoader()
const modelPath = import.meta.env.BASE_URL + 'assets/stella-3d-reference.glb'
loader.load(
  modelPath,
  (gltf) => {
    const model = gltf.scene
    scene.add(model)

    // Only render the front (normal) side of each mesh; back faces are culled
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((mat) => {
          mat.side = THREE.FrontSide
        })
      }
    })

    // Center the model
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())

    model.position.sub(center)
    model.updateMatrixWorld(true)
    loadedModel = model

    rebuildEdgeLines()

    // Apply the camera rotation based on the direction we want
    const euler = new THREE.Euler(cameraRotation.pitch, cameraRotation.yaw, 0, 'YXZ')
    camera.quaternion.setFromEuler(euler)

    console.log('Model loaded successfully, edge-line sets:', wireframeOverlayMeshes.length)
  },
  (progress) => {
    console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(2)}%`)
  },
  (error) => {
    console.error('Error loading model:', error)
  }
)

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Animation loop
function animate() {
  requestAnimationFrame(animate)

  // Get camera direction vectors
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
  const up = new THREE.Vector3(0, 1, 0)

  // Calculate current movement speed (apply sprint multiplier if shift is held)
  const currentSpeed = keys['shift'] ? moveSpeed * sprintMultiplier : moveSpeed

  // WASD movement
  if (keys['w']) camera.position.addScaledVector(forward, currentSpeed)
  if (keys['s']) camera.position.addScaledVector(forward, -currentSpeed)
  if (keys['a']) camera.position.addScaledVector(right, -currentSpeed)
  if (keys['d']) camera.position.addScaledVector(right, currentSpeed)
  if (keys[' ']) camera.position.addScaledVector(up, currentSpeed)
  if (keys['c']) camera.position.addScaledVector(up, -currentSpeed)

  renderer.render(scene, camera)
}

// Controls card minimize/expand
const controlsCard = document.getElementById('controls-card')
const controlsCardToggle = document.getElementById('controls-card-toggle')
if (controlsCard && controlsCardToggle) {
  controlsCardToggle.addEventListener('click', () => {
    const minimized = controlsCard.classList.toggle('controls-card--minimized')
    controlsCardToggle.textContent = minimized ? '+' : '−'
    controlsCardToggle.setAttribute('aria-label', minimized ? 'Expand' : 'Minimize')
    controlsCardToggle.setAttribute('title', minimized ? 'Expand' : 'Minimize')
  })
}

animate()
