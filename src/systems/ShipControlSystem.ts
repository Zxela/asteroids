/**
 * Ship Control System
 *
 * Converts player input to ship rotation and acceleration.
 * Reads the InputSystem's movement state each frame and applies:
 * - Rotation based on left/right input (horizontal axis)
 * - Acceleration based on up input (vertical axis, only positive)
 *
 * Forward direction is calculated from the ship's Z rotation:
 * - rotation.z = 0: forward = (0, 1) = +Y (up)
 * - rotation.z = PI/2: forward = (1, 0) = +X (right)
 * - rotation.z = PI: forward = (0, -1) = -Y (down)
 * - rotation.z = -PI/2: forward = (-1, 0) = -X (left)
 *
 * Emits 'shipThrust' events when player is accelerating for particle effects.
 *
 * Following ADR-0002: Custom arcade physics for game entity movement.
 */

import { Vector3 } from 'three'
import { Physics, Player, Transform, Velocity } from '../components'
import { gameConfig } from '../config'
import { componentClass } from '../ecs/types'
import type { World as IWorld, System } from '../ecs/types'
import type { ShipThrustEventData } from '../types/events'
import type { EventEmitter } from '../utils/EventEmitter'
import type { InputSystem } from './InputSystem'

/**
 * Event types for ship control system.
 */
interface ShipControlEvents extends Record<string, unknown> {
  shipThrust: ShipThrustEventData
}

// Type assertions for component classes to work with ECS type system
const TransformClass = componentClass(Transform)
const VelocityClass = componentClass(Velocity)
const PhysicsClass = componentClass(Physics)
const PlayerClass = componentClass(Player)

/**
 * ShipControlSystem - processes player input and applies to ship physics.
 *
 * Query: Entities with Transform, Velocity, Physics, and Player components.
 * Only player entities are controlled by input.
 *
 * Performance: Targets <0.5ms per frame execution time.
 */
export class ShipControlSystem implements System {
  private readonly inputSystem: InputSystem
  private readonly eventEmitter: EventEmitter<ShipControlEvents> | null

  /** Track previous thrust state to detect state changes */
  private wasThrusting = false

  /**
   * Creates a new ShipControlSystem.
   *
   * @param inputSystem - The InputSystem instance to read movement input from
   * @param eventEmitter - Optional EventEmitter for thrust particle effects
   */
  constructor(inputSystem: InputSystem, eventEmitter?: EventEmitter<ShipControlEvents>) {
    this.inputSystem = inputSystem
    this.eventEmitter = eventEmitter ?? null
  }

  /**
   * Update ship control for all player entities.
   *
   * @param world - The ECS world instance
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(world: IWorld, deltaTime: number): void {
    // Convert deltaTime from milliseconds to seconds for physics calculations
    const dt = deltaTime / 1000

    // Early exit if no time has passed
    if (dt <= 0) {
      return
    }

    // Get current movement input from InputSystem
    const movement = this.inputSystem.getMovementInput()

    // Query for player entities (entities with Transform, Velocity, Physics, and Player)
    const playerEntities = world.query(TransformClass, VelocityClass, PhysicsClass, PlayerClass)

    for (const entityId of playerEntities) {
      const transform = world.getComponent(entityId, TransformClass)
      const velocity = world.getComponent(entityId, VelocityClass)

      // Safety check - all components should exist from query
      if (!transform || !velocity) {
        continue
      }

      // Apply rotation directly to transform for classic instant-response feel
      // Left input (negative x) = positive rotation (counter-clockwise)
      // Right input (positive x) = negative rotation (clockwise)
      // Classic Asteroids: Direct rotation - no angular velocity, immediate response
      if (Math.abs(movement.x) > 0.001) {
        const rotationAmount = -movement.x * gameConfig.physics.shipRotationSpeed * dt
        transform.rotation.z += rotationAmount
      }

      // Apply acceleration based on vertical input (up only, not down)
      // Only accelerate when forward input is positive
      const isThrusting = movement.y > 0.001
      if (isThrusting) {
        // Get ship's forward direction from Z rotation
        const forward = this.getForwardDirection(transform.rotation.z)

        // Apply acceleration in forward direction
        // acceleration = direction * thrust * inputMagnitude * dt
        const acceleration = gameConfig.physics.shipAcceleration * movement.y * dt
        velocity.linear.x += forward.x * acceleration
        velocity.linear.y += forward.y * acceleration

        // Emit shipThrust event for particle effects
        if (this.eventEmitter) {
          this.eventEmitter.emit('shipThrust', {
            entityId: entityId,
            position: new Vector3(transform.position.x, transform.position.y, transform.position.z),
            direction: new Vector3(forward.x, forward.y, 0),
            active: true
          })
        }
      } else if (this.wasThrusting && this.eventEmitter) {
        // Emit thrust deactivation event
        const forward = this.getForwardDirection(transform.rotation.z)
        this.eventEmitter.emit('shipThrust', {
          entityId: entityId,
          position: new Vector3(transform.position.x, transform.position.y, transform.position.z),
          direction: new Vector3(forward.x, forward.y, 0),
          active: false
        })
      }

      this.wasThrusting = isThrusting
    }
  }

  /**
   * Calculate the forward direction vector from a Z rotation angle.
   *
   * The forward direction is calculated using trigonometry:
   * - x = -sin(rotation) - gives horizontal component (negative for correct CCW rotation)
   * - y = cos(rotation) - gives vertical component
   *
   * This means (with positive rotation = counter-clockwise):
   * - rotation = 0: forward = (0, 1) = up
   * - rotation = PI/2: forward = (-1, 0) = left (after turning left 90°)
   * - rotation = PI: forward = (0, -1) = down
   * - rotation = -PI/2: forward = (1, 0) = right (after turning right 90°)
   *
   * @param rotationZ - The Z rotation angle in radians
   * @returns Object with x and y components of the forward direction (unit vector)
   */
  private getForwardDirection(rotationZ: number): { x: number; y: number } {
    return {
      x: -Math.sin(rotationZ),
      y: Math.cos(rotationZ)
    }
  }
}
