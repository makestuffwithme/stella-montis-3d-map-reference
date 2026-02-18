import * as THREE from 'three'

// Mobile touch controls state
const mobileTouchState = {
  lastTouchX: 0,
  lastTouchY: 0,
  lastPanX: 0,
  lastPanY: 0,
}

let lastPinchDistance = 0
let mobileControlsSetup = false

function getTouchDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX
  const dy = touch1.clientY - touch2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function getTouchCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  }
}

export function setupTouchControls(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  cameraRotation: { yaw: number; pitch: number }
) {
  if (mobileControlsSetup) return
  mobileControlsSetup = true
  
  let lastTouchCount = 0
  
  renderer.domElement.addEventListener('touchstart', (e) => {
    lastTouchCount = e.touches.length
    
    if (e.touches.length === 1) {
      // Single finger - prepare for rotation
      mobileTouchState.lastTouchX = e.touches[0].clientX
      mobileTouchState.lastTouchY = e.touches[0].clientY
    } else if (e.touches.length === 2) {
      // Two fingers - prepare for pan and pinch
      lastPinchDistance = getTouchDistance(e.touches[0], e.touches[1])
      const center = getTouchCenter(e.touches[0], e.touches[1])
      mobileTouchState.lastPanX = center.x
      mobileTouchState.lastPanY = center.y
    }
  })

  renderer.domElement.addEventListener('touchmove', (e) => {
    e.preventDefault()
    
    // Check if touch count changed (e.g., lifted one finger)
    if (e.touches.length !== lastTouchCount) {
      lastTouchCount = e.touches.length
      
      // Reset positions to prevent jumps
      if (e.touches.length === 1) {
        mobileTouchState.lastTouchX = e.touches[0].clientX
        mobileTouchState.lastTouchY = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        const center = getTouchCenter(e.touches[0], e.touches[1])
        mobileTouchState.lastPanX = center.x
        mobileTouchState.lastPanY = center.y
        lastPinchDistance = getTouchDistance(e.touches[0], e.touches[1])
      }
      return
    }
    
    if (e.touches.length === 1) {
      // Single finger drag - rotate camera (object rotation style)
      const touchX = e.touches[0].clientX
      const touchY = e.touches[0].clientY
      
      const deltaX = touchX - mobileTouchState.lastTouchX
      const deltaY = touchY - mobileTouchState.lastTouchY
      
      const sensitivity = 0.005
      // Inverted for object rotation feel (drag right = rotate right, drag down = rotate down)
      cameraRotation.yaw += deltaX * sensitivity
      cameraRotation.pitch += deltaY * sensitivity
      cameraRotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.pitch))
      
      const euler = new THREE.Euler(cameraRotation.pitch, cameraRotation.yaw, 0, 'YXZ')
      camera.quaternion.setFromEuler(euler)
      
      mobileTouchState.lastTouchX = touchX
      mobileTouchState.lastTouchY = touchY
      
    } else if (e.touches.length === 2) {
      // Two finger gesture - pan and pinch
      const center = getTouchCenter(e.touches[0], e.touches[1])
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1])
      
      // Pan (two-finger drag)
      const panDeltaX = center.x - mobileTouchState.lastPanX
      const panDeltaY = center.y - mobileTouchState.lastPanY
      
      const panSpeed = 0.03
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
      const up = new THREE.Vector3(0, 1, 0)
      
      camera.position.addScaledVector(right, -panDeltaX * panSpeed)
      camera.position.addScaledVector(up, panDeltaY * panSpeed)
      
      mobileTouchState.lastPanX = center.x
      mobileTouchState.lastPanY = center.y
      
      // Pinch (zoom in/out = move forward/backward)
      if (lastPinchDistance > 0) {
        const pinchDelta = currentDistance - lastPinchDistance
        const moveSpeed = 0.1
        
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
        camera.position.addScaledVector(forward, pinchDelta * moveSpeed)
      }
      
      lastPinchDistance = currentDistance
    }
  }, { passive: false })

  renderer.domElement.addEventListener('touchend', (e) => {
    lastTouchCount = e.touches.length
    lastPinchDistance = 0
    
    // Update positions for remaining touches to prevent jumps
    if (e.touches.length === 1) {
      mobileTouchState.lastTouchX = e.touches[0].clientX
      mobileTouchState.lastTouchY = e.touches[0].clientY
    } else if (e.touches.length === 2) {
      const center = getTouchCenter(e.touches[0], e.touches[1])
      mobileTouchState.lastPanX = center.x
      mobileTouchState.lastPanY = center.y
      lastPinchDistance = getTouchDistance(e.touches[0], e.touches[1])
    }
  })
}
