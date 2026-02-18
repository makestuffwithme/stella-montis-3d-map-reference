import * as THREE from 'three'

export function setupLighting(scene: THREE.Scene) {
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
}

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
const wireframeOverlayMeshes: THREE.LineSegments[] = []

export function setupEdgeLines(scene: THREE.Scene) {
  scene.add(wireframeOverlayGroup)
}

export function rebuildEdgeLines(model: THREE.Group) {
  wireframeOverlayMeshes.length = 0
  while (wireframeOverlayGroup.children.length) {
    const c = wireframeOverlayGroup.children[0]
    wireframeOverlayGroup.remove(c)
    if (c instanceof THREE.LineSegments && c.geometry) c.geometry.dispose()
  }

  const _wPos = new THREE.Vector3()
  const _wQuat = new THREE.Quaternion()
  const _wScale = new THREE.Vector3()
  
  model.traverse((child) => {
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
