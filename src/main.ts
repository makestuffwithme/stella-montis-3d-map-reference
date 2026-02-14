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

// Audio radius visualizer setup
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Lighting - optimized for interior scene differentiation
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

// Main light from top-right-front (bright, reveals floor vs walls)
const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2)
directionalLight1.position.set(10, 15, 8)
directionalLight1.castShadow = true
scene.add(directionalLight1)

// Fill light from left side
const directionalLight2 = new THREE.DirectionalLight(0x88ccff, 0.6)
directionalLight2.position.set(-12, 5, 5)
scene.add(directionalLight2)

// Back light for separation
const directionalLight3 = new THREE.DirectionalLight(0xffaa88, 0.4)
directionalLight3.position.set(0, 8, -12)
scene.add(directionalLight3)

// First-person camera controls (Minecraft creative mode style)
const keys: Record<string, boolean> = {}
const moveSpeed = 0.1
const sprintMultiplier = 2.0 // Speed multiplier when sprinting

// Debug mode toggle
const debugMode = {
  wireframe: false,
  doubleShade: false,
}

// Initialize camera position
camera.position.set(-1.23, 23.44, 50.22)

// Debug key bindings
window.addEventListener('keydown', (e) => {
  if (e.key === '1') {
    e.preventDefault()
    debugMode.wireframe = !debugMode.wireframe
    console.log('Wireframe toggled:', debugMode.wireframe)
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.wireframe = debugMode.wireframe
      }
    })
  }
  if (e.key === '2') {
    e.preventDefault()
    debugMode.doubleShade = !debugMode.doubleShade
    console.log('Double-sided shading toggled:', debugMode.doubleShade)
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.side = debugMode.doubleShade ? THREE.DoubleSide : THREE.FrontSide
      }
    })
  }
})

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
    
    // Apply the camera rotation based on the direction we want
    const euler = new THREE.Euler(cameraRotation.pitch, cameraRotation.yaw, 0, 'YXZ')
    camera.quaternion.setFromEuler(euler)
  
    console.log('Model loaded successfully')
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
