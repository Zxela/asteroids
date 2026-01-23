/**
 * Physics System
 *
 * Handles physics simulation for entities with Transform, Velocity, and Physics components.
 * Implements:
 * - Position updates based on velocity and deltaTime
 * - Exponential damping to reduce velocity over time
 * - Max speed enforcement to clamp velocity magnitude
 * - Screen wrapping (toroidal topology) for entities with wrapScreen enabled
 *
 * Following ADR-0002: Custom arcade physics for game entity movement.
 */

import { Physics, Transform, Velocity } from '../components'
import type { ComponentClass, World as IWorld, System } from '../ecs/types'

// Screen dimensions for wrapping calculations
// These match the Design Doc specifications for game resolution
const SCREEN_WIDTH = 1920
const SCREEN_HEIGHT = 1080
const SCREEN_HALF_WIDTH = SCREEN_WIDTH / 2
const SCREEN_HALF_HEIGHT = SCREEN_HEIGHT / 2
const Z_DEPTH = 500 // Z-axis wrapping depth for 2.5D gameplay

// Type assertions for component classes to work with ECS type system
// Runtime behavior is correct; this bridges TypeScript's stricter type checking
const TransformClass = Transform as unknown as ComponentClass<Transform>
const VelocityClass = Velocity as unknown as ComponentClass<Velocity>
const PhysicsClass = Physics as unknown as ComponentClass<Physics>

/**
 * PhysicsSystem class - processes physics simulation for all physics-enabled entities.
 *
 * Performance: Targets <1ms per frame execution time.
 * This is a hot path that runs every frame, so operations are optimized.
 */
export class PhysicsSystem implements System {
  /**
   * Update physics for all entities with Transform, Velocity, and Physics components.
   *
   * @param world - The ECS world instance
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(world: IWorld, deltaTime: number): void {
    // Convert deltaTime from milliseconds to seconds for physics calculations
    const dt = deltaTime / 1000

    // Early exit if no time has passed (prevents division issues)
    if (dt <= 0) {
      return
    }

    // Query all entities with required physics components
    const entities = world.query(TransformClass, VelocityClass, PhysicsClass)

    for (const entityId of entities) {
      const transform = world.getComponent(entityId, TransformClass)
      const velocity = world.getComponent(entityId, VelocityClass)
      const physics = world.getComponent(entityId, PhysicsClass)

      // Safety check - all components should exist from query
      if (!transform || !velocity || !physics) {
        continue
      }

      // Update position based on linear velocity (p = p0 + v*dt)
      transform.position.x += velocity.linear.x * dt
      transform.position.y += velocity.linear.y * dt
      transform.position.z += velocity.linear.z * dt

      // Update rotation based on angular velocity
      transform.rotation.x += velocity.angular.x * dt
      transform.rotation.y += velocity.angular.y * dt
      transform.rotation.z += velocity.angular.z * dt

      // Apply exponential damping: v = v0 * damping^dt
      // This creates smooth deceleration that is framerate-independent
      const dampingFactor = physics.damping ** dt
      velocity.linear.multiplyScalar(dampingFactor)
      velocity.angular.multiplyScalar(dampingFactor)

      // Enforce max speed limit on velocity magnitude
      this.enforceMaxSpeed(velocity, physics.maxSpeed)

      // Apply screen wrapping if enabled (toroidal topology)
      if (physics.wrapScreen) {
        this.wrapScreenCoordinates(transform)
      }
    }
  }

  /**
   * Enforce maximum speed limit by clamping velocity magnitude.
   * Preserves velocity direction while limiting magnitude.
   *
   * @param velocity - Velocity component to clamp
   * @param maxSpeed - Maximum allowed speed
   */
  private enforceMaxSpeed(velocity: Velocity, maxSpeed: number): void {
    const linearSpeed = velocity.linear.length()
    if (linearSpeed > maxSpeed) {
      velocity.linear.normalize().multiplyScalar(maxSpeed)
    }

    const angularSpeed = velocity.angular.length()
    if (angularSpeed > maxSpeed) {
      velocity.angular.normalize().multiplyScalar(maxSpeed)
    }
  }

  /**
   * Wrap entity position at screen boundaries (toroidal topology).
   * Entity exiting one edge reappears on opposite edge.
   *
   * @param transform - Transform component to wrap
   */
  private wrapScreenCoordinates(transform: Transform): void {
    // Wrap X axis (horizontal)
    if (transform.position.x > SCREEN_HALF_WIDTH) {
      transform.position.x = -SCREEN_HALF_WIDTH
    } else if (transform.position.x < -SCREEN_HALF_WIDTH) {
      transform.position.x = SCREEN_HALF_WIDTH
    }

    // Wrap Y axis (vertical)
    if (transform.position.y > SCREEN_HALF_HEIGHT) {
      transform.position.y = -SCREEN_HALF_HEIGHT
    } else if (transform.position.y < -SCREEN_HALF_HEIGHT) {
      transform.position.y = SCREEN_HALF_HEIGHT
    }

    // Wrap Z axis (depth for 2.5D gameplay)
    if (transform.position.z > Z_DEPTH) {
      transform.position.z = -Z_DEPTH
    } else if (transform.position.z < -Z_DEPTH) {
      transform.position.z = Z_DEPTH
    }
  }
}
