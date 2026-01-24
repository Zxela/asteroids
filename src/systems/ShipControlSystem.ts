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
 * Following ADR-0002: Custom arcade physics for game entity movement.
 */

import { Physics, Player, Transform, Velocity } from '../components'
import { gameConfig } from '../config'
import type { ComponentClass, World as IWorld, System } from '../ecs/types'
import type { InputSystem } from './InputSystem'

// Type assertions for component classes to work with ECS type system
const TransformClass = Transform as unknown as ComponentClass<Transform>
const VelocityClass = Velocity as unknown as ComponentClass<Velocity>
const PhysicsClass = Physics as unknown as ComponentClass<Physics>
const PlayerClass = Player as unknown as ComponentClass<Player>

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

  /**
   * Creates a new ShipControlSystem.
   *
   * @param inputSystem - The InputSystem instance to read movement input from
   */
  constructor(inputSystem: InputSystem) {
    this.inputSystem = inputSystem
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

      // Apply rotation based on horizontal input (left/right)
      // Left input (negative x) = positive rotation (counter-clockwise)
      // Right input (positive x) = negative rotation (clockwise)
      if (Math.abs(movement.x) > 0.001) {
        const rotationAmount = -movement.x * gameConfig.physics.shipRotationSpeed * dt
        velocity.angular.z += rotationAmount
      }

      // Apply acceleration based on vertical input (up only, not down)
      // Only accelerate when forward input is positive
      if (movement.y > 0.001) {
        // Get ship's forward direction from Z rotation
        const forward = this.getForwardDirection(transform.rotation.z)

        // Apply acceleration in forward direction
        // acceleration = direction * thrust * inputMagnitude * dt
        const acceleration = gameConfig.physics.shipAcceleration * movement.y * dt
        velocity.linear.x += forward.x * acceleration
        velocity.linear.y += forward.y * acceleration
      }
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
