/**
 * Camera Animation System
 * 
 * Handles all camera animations separately from the main controller
 * to improve testability and modularity.
 */

import * as THREE from 'three'
import type { ViewModeConfig } from '@/engine/types/view-mode-config'

export interface CameraAnimationConfig {
  duration: number
  easingFunction: string
  onComplete?: () => void
  onUpdate?: (progress: number) => void
}

export interface AnimationState {
  isAnimating: boolean
  startTime: number
  startPosition: THREE.Vector3
  startTarget: THREE.Vector3
  endPosition: THREE.Vector3
  endTarget: THREE.Vector3
  config: CameraAnimationConfig
}

export class CameraAnimator {
  private currentAnimation: AnimationState | null = null
  private animationFrame: number | null = null

  constructor(
    private camera: THREE.Camera,
    private controls: any
  ) {}

  // Easing functions
  private createEasingFunction(easingType: string): (t: number) => number {
    switch (easingType) {
      case 'linear':
        return (t: number) => t
      case 'easeOut':
        return (t: number) => 1 - Math.pow(1 - t, 3)
      case 'easeInOut':
        return (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      case 'leap':
        return (t: number) => {
          if (t < 0.3) {
            return t * 3.33 * t // Quadratic acceleration
          } else {
            const settleProgress = (t - 0.3) / 0.7
            return 0.33 + 0.67 * (1 - Math.pow(1 - settleProgress, 3))
          }
        }
      default:
        return (t: number) => 1 - Math.pow(1 - t, 3)
    }
  }

  // Start a new animation
  animateTo(
    targetPosition: THREE.Vector3,
    targetTarget: THREE.Vector3,
    config: CameraAnimationConfig
  ): Promise<void> {
    return new Promise((resolve) => {
      // Stop any existing animation
      this.stopAnimation()

      if (!this.controls) {
        console.warn("Cannot animate: controls not available")
        resolve()
        return
      }

      this.currentAnimation = {
        isAnimating: true,
        startTime: Date.now(),
        startPosition: this.camera.position.clone(),
        startTarget: this.controls.target.clone(),
        endPosition: targetPosition.clone(),
        endTarget: targetTarget.clone(),
        config: {
          ...config,
          onComplete: () => {
            config.onComplete?.()
            resolve()
          }
        }
      }

      // Disable controls during animation
      if (this.controls.enabled !== undefined) {
        this.controls.enabled = false
      }

      this.animate()
    })
  }

  // Main animation loop
  private animate = () => {
    if (!this.currentAnimation || !this.controls) {
      this.stopAnimation()
      return
    }

    const { startTime, startPosition, startTarget, endPosition, endTarget, config } = this.currentAnimation
    
    const now = Date.now()
    const elapsed = now - startTime
    const progress = Math.min(elapsed / config.duration, 1)
    const easingFunction = this.createEasingFunction(config.easingFunction)
    const easeProgress = easingFunction(progress)

    // Interpolate camera position and target
    this.camera.position.lerpVectors(startPosition, endPosition, easeProgress)
    this.controls.target.lerpVectors(startTarget, endTarget, easeProgress)

    // Update controls without enabling them
    this.controls.update()

    // Call update callback
    config.onUpdate?.(progress)

    if (progress < 1) {
      this.animationFrame = requestAnimationFrame(this.animate)
    } else {
      // Animation complete
      this.camera.position.copy(endPosition)
      this.controls.target.copy(endTarget)
      this.controls.update()

      // Save this state as the new "home" state for the controls
      if (this.controls.saveState) {
        this.controls.saveState()
      }

      // Re-enable controls
      if (this.controls.enabled !== undefined) {
        this.controls.enabled = true
      }

      const onComplete = config.onComplete
      this.stopAnimation()
      onComplete?.()
    }
  }

  // Stop current animation
  stopAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    if (this.currentAnimation) {
      // Re-enable controls if animation was stopped early
      if (this.controls && this.controls.enabled !== undefined) {
        this.controls.enabled = true
      }
      this.currentAnimation = null
    }
  }

  // Check if currently animating
  isAnimating(): boolean {
    return this.currentAnimation?.isAnimating ?? false
  }

  // Dispose of resources
  dispose(): void {
    this.stopAnimation()
  }
}

// Camera position calculator
export class CameraPositionCalculator {
  static calculateBirdsEyePosition(
    maxOrbitRadius: number,
    viewConfig: ViewModeConfig,
    viewMode: string
  ): { position: THREE.Vector3; target: THREE.Vector3 } {
    const center = new THREE.Vector3()
    const angle = viewConfig.cameraConfig.viewingAngles.birdsEyeElevation * (Math.PI / 180)
    const distance = maxOrbitRadius

    // Calculate position components for birds-eye view
    const horizontalDistance = distance * Math.cos(angle)
    const verticalDistance = distance * Math.sin(angle)

    let position: THREE.Vector3
    if (viewMode === 'profile') {
      // Top-down view for profile mode
      position = new THREE.Vector3(0, 0, distance)
    } else {
      // Angled view for other modes
      position = new THREE.Vector3(
        horizontalDistance * 0.7,
        verticalDistance,
        horizontalDistance * 0.7
      )
    }

    return { position, target: center.clone() }
  }

  static calculateFocusPosition(
    objectPosition: THREE.Vector3,
    targetDistance: number,
    viewConfig: ViewModeConfig,
    viewMode: string
  ): { position: THREE.Vector3; target: THREE.Vector3 } {
    // Generate a consistent horizontal direction for camera positioning
    const horizontalDirection = new THREE.Vector3(1, 0, 1).normalize()

    let position: THREE.Vector3
    let target: THREE.Vector3

    if (viewMode === 'profile') {
      // Top-down view for profile mode
      position = objectPosition.clone().add(new THREE.Vector3(0, 0, targetDistance))
      target = objectPosition.clone()
    } else {
      // Use configured viewing angle
      const downwardAngle = viewConfig.cameraConfig.viewingAngles.defaultElevation * (Math.PI / 180)
      const horizontalDistance = targetDistance * Math.cos(downwardAngle)
      const verticalDistance = targetDistance * Math.sin(downwardAngle)

      position = objectPosition
        .clone()
        .add(horizontalDirection.clone().multiplyScalar(horizontalDistance))
        .add(new THREE.Vector3(0, verticalDistance, 0))
      target = objectPosition.clone()
    }

    return { position, target }
  }

  static calculateInitialSystemPosition(
    maxOrbitRadius: number,
    viewConfig: ViewModeConfig,
    viewMode: string
  ): { position: THREE.Vector3; target: THREE.Vector3 } {
    const center = new THREE.Vector3()
    const angle = viewConfig.cameraConfig.viewingAngles.defaultElevation * (Math.PI / 180)
    const distance = maxOrbitRadius * 0.75

    // Calculate position components
    const horizontalDistance = distance * Math.cos(angle)
    const verticalDistance = distance * Math.sin(angle)

    let position: THREE.Vector3
    if (viewMode === 'profile') {
      // Top-down view for profile mode
      position = new THREE.Vector3(0, 0, distance)
    } else {
      // Angled view for other modes
      position = new THREE.Vector3(
        horizontalDistance,
        verticalDistance,
        horizontalDistance
      )
    }
    
    return { position, target: center.clone() }
  }
} 