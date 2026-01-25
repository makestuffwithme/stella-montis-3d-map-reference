import * as THREE from 'three'

/**
 * Creates a simple beeping camera object that can be clicked to show audio radius
 * This is a visual indicator for cameras that beep when players get close
 */
export function createBeepingCamera(position: THREE.Vector3): THREE.Group {
  const group = new THREE.Group()
  group.position.copy(position)
  group.userData.isBeepingCamera = true

  // Camera body - a small box
  const bodyGeometry = new THREE.BoxGeometry(0.3, 0.25, 0.25)
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x222222,
    shininess: 30,
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  group.add(body)

  // Lens - a small sphere at the front
  const lensGeometry = new THREE.SphereGeometry(0.12, 16, 16)
  const lensMaterial = new THREE.MeshPhongMaterial({
    color: 0x1a4d7a,
    emissive: 0x0f2847,
    shininess: 60,
  })
  const lens = new THREE.Mesh(lensGeometry, lensMaterial)
  lens.position.z = 0.2
  group.add(lens)

  // Indicator light - a small glowing sphere
  const lightGeometry = new THREE.SphereGeometry(0.05, 8, 8)
  const lightMaterial = new THREE.MeshPhongMaterial({
    color: 0xff4444,
    emissive: 0xff0000,
    shininess: 100,
  })
  const light = new THREE.Mesh(lightGeometry, lightMaterial)
  light.position.set(0.1, 0.1, -0.1)
  group.add(light)

  return group
}
