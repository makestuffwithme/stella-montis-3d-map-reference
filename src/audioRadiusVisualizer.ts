import * as THREE from 'three'

export class AudioRadiusVisualizer {
  private scene: THREE.Scene
  private currentSphere: THREE.Mesh | null = null

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  /**
   * Show a static audio radius sphere at the given position
   * @param position - World position where the audio radius should emanate from
   * @param radius - Radius of the sphere (default: 10 units)
   */
  public showStaticAudioRadius(
    position: THREE.Vector3,
    radius: number = 10
  ): void {
    // Hide any existing sphere first
    this.hideAudioRadius()

    // Create a sphere geometry with good detail for smooth rendering
    const geometry = new THREE.SphereGeometry(radius, 32, 32)
    
    // Create material with transparency and wireframe for audio radius visualization
    const material = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      emissive: 0x2255ff,
      transparent: true,
      opacity: 0.4,
      wireframe: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    this.scene.add(mesh)

    this.currentSphere = mesh

    console.log(`Audio radius sphere shown at position: ${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}, radius: ${radius}`)
  }

  /**
   * Hide the current audio radius sphere
   */
  public hideAudioRadius(): void {
    if (this.currentSphere) {
      this.scene.remove(this.currentSphere)
      if (this.currentSphere.geometry) this.currentSphere.geometry.dispose()
      if (this.currentSphere.material instanceof THREE.Material) {
        this.currentSphere.material.dispose()
      }
      this.currentSphere = null
      console.log('Audio radius sphere hidden')
    }
  }

}
