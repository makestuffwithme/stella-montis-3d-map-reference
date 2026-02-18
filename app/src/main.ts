/// <reference types="vite/client" />
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import './style.css'
import { setupDesktopControls, updateDesktopMovement } from './controls/desktop'
import { setupTouchControls } from './controls/touch'
import { setupLighting, setupEdgeLines, rebuildEdgeLines } from './lighting'
import { mount } from 'svelte'
import ControlsCard from './components/ControlsCard.svelte'
import DisclaimerCard from './components/DisclaimerCard.svelte'
import InfoModal from './components/InfoModal.svelte'
import modelUrl from './assets/stella-3d-reference.glb?url'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a1a)
setupLighting(scene)
setupEdgeLines(scene)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(-1.23, 23.44, 50.22)

const cameraRotation = {
  yaw: Math.atan2(0, 1),
  pitch: Math.asin(-0.5),
}

function getModelUrl(): string {
  if (import.meta.env.CDN_BASE) {
    const filename = modelUrl.replace('/stella-montis-3d-map-reference/assets/', '/')
    return new URL(filename, import.meta.env.CDN_BASE).toString()
  }
  return modelUrl
}

const loader = new GLTFLoader()
const modelPath = getModelUrl()
loader.load(
  modelPath,
  (gltf) => {
    const model = gltf.scene
    scene.add(model)

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((mat) => {
          mat.side = THREE.FrontSide
        })
      }
    })

    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())

    model.position.sub(center)
    model.updateMatrixWorld(true)

    rebuildEdgeLines(model)

    const euler = new THREE.Euler(cameraRotation.pitch, cameraRotation.yaw, 0, 'YXZ')
    camera.quaternion.setFromEuler(euler)

    console.log('Model loaded successfully')
  },
  (progress) => {
    console.log('Model loading progress:', progress)
  },
  (error) => {
    console.error('Error loading model:', error)
  }
)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.getElementById('app')!.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const isMobile = navigator.maxTouchPoints > 0
if (isMobile) {
  setupTouchControls(renderer, camera, cameraRotation)
} else {
  const mouse = new THREE.Vector2()
  setupDesktopControls(renderer, camera, cameraRotation, mouse)
}

function animate() {
  requestAnimationFrame(animate)

  if (!isMobile) {
    updateDesktopMovement(camera)
  }

  renderer.render(scene, camera)
}

animate()

let openInfoModal: (() => void) | undefined

mount(InfoModal, {
  target: document.body,
  props: {
    onRequestOpen: (fn: () => void) => {
      openInfoModal = fn
    }
  }
})

mount(ControlsCard, {
  target: document.body,
  props: {
    isMobile,
    onInfoClick: () => openInfoModal?.()
  }
})

mount(DisclaimerCard, {
  target: document.body,
})

