import * as THREE from 'three'

const keys: Record<string, boolean> = {}
export const moveSpeed = 0.045
export const sprintMultiplier = 1.8

const mouseLook = {
  lastX: 0,
  lastY: 0,
}

function getMouseLookSign(): number {
  const invertMouse = localStorage.getItem('stella-montis-invert-mouse') === 'true'
  return invertMouse ? 1 : -1
}

export function setupDesktopControls(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  cameraRotation: { yaw: number; pitch: number },
  mouse: THREE.Vector2
) {
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true
  })

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false
  })

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })

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
      const sensitivity = 0.002
      const pitchSign = getMouseLookSign() // invert applies only to up/down
      cameraRotation.yaw += event.movementX * sensitivity * -1
      cameraRotation.pitch += event.movementY * sensitivity * pitchSign
      cameraRotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.pitch))
      const euler = new THREE.Euler(cameraRotation.pitch, cameraRotation.yaw, 0, 'YXZ')
      camera.quaternion.setFromEuler(euler)
    } else {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
      mouseLook.lastX = event.clientX
      mouseLook.lastY = event.clientY
    }
  })
}

export function updateDesktopMovement(camera: THREE.Camera) {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
  const up = new THREE.Vector3(0, 1, 0)

  const currentSpeed = keys['shift'] ? moveSpeed * sprintMultiplier : moveSpeed

  if (keys['w']) camera.position.addScaledVector(forward, currentSpeed)
  if (keys['s']) camera.position.addScaledVector(forward, -currentSpeed)
  if (keys['a']) camera.position.addScaledVector(right, -currentSpeed)
  if (keys['d']) camera.position.addScaledVector(right, currentSpeed)
  if (keys[' ']) camera.position.addScaledVector(up, currentSpeed)
  if (keys['c']) camera.position.addScaledVector(up, -currentSpeed)
}
