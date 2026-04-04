import * as THREE from 'three'
import { buildPathLine, nearestReachableExit } from '../navigation/pathfinding'
import { EYE_HEIGHT } from '../navigation/navGraph'

const keys: Record<string, boolean> = {}
export const moveSpeed = 0.07
export const sprintMultiplier = 1.8

let currentPathLine: THREE.Line | null = null
let pathAnimation: { active: boolean; path: THREE.Vector3[]; targetIndex: number; progress: number } | null = null

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
  mouse: THREE.Vector2,
  scene: THREE.Scene
) {
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase()

    if (key === 'e' && e.shiftKey) {
      // Stop any existing animation
      if (pathAnimation) {
        pathAnimation.active = false
        pathAnimation = null
      }

      // Clear any previous path line immediately
      if (currentPathLine) {
        scene.remove(currentPathLine)
        currentPathLine.geometry.dispose()
        ;(currentPathLine.material as THREE.Material).dispose()
        currentPathLine = null
      }

      // Calculate nav-node path to nearest exit (not direct camera->exit line)
      const graph = (window as any).navGraph
      const exits = (window as any).exits
      if (!graph || !exits) {
        console.warn('Nav graph or exits not available')
        return
      }

      try {
        const result = nearestReachableExit(graph, exits, camera.position)
        if (!result) {
          console.log('No reachable exit found from current position')
          return
        }

        if (!Array.isArray(result.path) || result.path.length < 2) {
          console.warn('Path result is empty or invalid', result.path)
          return
        }

        console.log('Nearest reachable exit:', result.exit.label)
        currentPathLine = buildPathLine(result.path, 0x00ff00)
        currentPathLine.visible = true // Make the path visible
        scene.add(currentPathLine)
        console.log('Nav path line added to scene')

        // Start camera animation along the path
        pathAnimation = {
          active: true,
          path: result.path,
          targetIndex: 1, // Start moving toward the first nav point
          progress: 0
        }
      } catch (err) {
        console.error('Error computing or drawing nav path:', err)
      }

      return // Don't set in keys for movement
    }

    if (key === 'e' && !e.shiftKey) {
      // Stop any existing animation
      if (pathAnimation) {
        pathAnimation.active = false
        pathAnimation = null
      }

      // Clear any previous path line immediately
      if (currentPathLine) {
        scene.remove(currentPathLine)
        currentPathLine.geometry.dispose()
        ;(currentPathLine.material as THREE.Material).dispose()
        currentPathLine = null
      }

      // Calculate nav-node path to nearest exit (not direct camera->exit line)
      const graph = (window as any).navGraph
      const exits = (window as any).exits
      if (!graph || !exits) {
        console.warn('Nav graph or exits not available')
        return
      }

      try {
        const result = nearestReachableExit(graph, exits, camera.position)
        if (!result) {
          console.log('No reachable exit found from current position')
          return
        }

        if (!Array.isArray(result.path) || result.path.length === 0) {
          console.warn('Path result is empty or invalid', result.path)
          return
        }

        console.log('Nearest reachable exit:', result.exit.label)
        currentPathLine = buildPathLine(result.path, 0x00ff00)
        currentPathLine.visible = true // Make the path visible
        scene.add(currentPathLine)
        console.log('Nav path line added to scene')
      } catch (err) {
        console.error('Error computing or drawing nav path:', err)
      }

      return // Don't set in keys for movement
    }

    keys[key] = true
  })

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false
  })

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })

  renderer.domElement.addEventListener('click', (event) => {
    if (event.shiftKey && document.pointerLockElement !== renderer.domElement) {
      // perform raycast only when cursor is visible (pointer lock not active)
      const rect = renderer.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      const mouse = new THREE.Vector2(x, y)
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)
      const meshes = (window as any).mapMeshes as THREE.Mesh[]
      if (meshes && meshes.length > 0) {
        const intersections = raycaster.intersectObjects(meshes)

        // Filter out transparent materials
        const validIntersections = intersections.filter((intersection) => {
          // Skip if no face
          if (!intersection.face) return false

          // Check if material is transparent - if so, skip this intersection
          const mesh = intersection.object as THREE.Mesh
          const material = mesh.material
          if (material) {
            const materials = Array.isArray(material) ? material : [material]
            for (const mat of materials) {
              if (mat.transparent && mat.opacity < 1.0) {
                return false // Skip transparent materials
              }
            }
          }

          return true
        })

        if (validIntersections.length > 0) {
          // Use the closest valid intersection
          const intersection = validIntersections[0]
          const point = intersection.point
          camera.position.set(point.x, point.y + EYE_HEIGHT, point.z)
          cameraRotation.pitch = 0 // reset pitch to flat
          // keep yaw
          const euler = new THREE.Euler(cameraRotation.pitch, cameraRotation.yaw, 0, 'YXZ')
          camera.quaternion.setFromEuler(euler)
        }
      }
    } else if (!event.shiftKey) {
      if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock()
      } else {
        renderer.domElement.requestPointerLock()
      }
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

export function updateDesktopMovement(camera: THREE.Camera, cameraRotation: { yaw: number; pitch: number }) {
  // Handle path animation
  if (pathAnimation && pathAnimation.active) {
    const currentPoint = pathAnimation.path[pathAnimation.targetIndex - 1]
    const nextPoint = pathAnimation.path[pathAnimation.targetIndex]

    if (currentPoint && nextPoint) {
      // Check if user is manually moving - interrupt animation
      const isMoving = keys['w'] || keys['s'] || keys['a'] || keys['d'] || keys[' '] || keys['c']
      if (isMoving) {
        pathAnimation.active = false
        pathAnimation = null
        return
      }

      // Animate toward next point at sprint speed (matching Shift+W)
      const segmentDistance = currentPoint.distanceTo(nextPoint)
      const sprintSpeed = moveSpeed * sprintMultiplier // Same as manual sprint speed
      const animationSpeed = sprintSpeed / segmentDistance // Progress per frame to match sprint speed
      pathAnimation.progress += animationSpeed

      // Calculate current interpolated position
      const currentPos = new THREE.Vector3().lerpVectors(currentPoint, nextPoint, pathAnimation.progress)
      currentPos.y += EYE_HEIGHT

      if (pathAnimation.progress >= 1) {
        // Reached current target, move to next
        camera.position.copy(nextPoint)
        camera.position.y += EYE_HEIGHT
        pathAnimation.targetIndex++
        pathAnimation.progress = 0

        if (pathAnimation.targetIndex >= pathAnimation.path.length) {
          // Animation complete
          pathAnimation.active = false
          pathAnimation = null
          return
        }
      } else {
        // Interpolate position
        camera.position.copy(currentPos)
      }

      // Sync cameraRotation state with the new quaternion
      const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
      cameraRotation.yaw = euler.y
      cameraRotation.pitch = euler.x
    }
    return // Skip manual movement when animating
  }

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
