/**
 * Weapon System
 *
 * Handles weapon firing based on input (spacebar) and cooldown management.
 * Creates projectile entities when fire conditions are met:
 * - Spacebar action is active (from InputSystem)
 * - Weapon cooldown has expired
 *
 * Emits 'weaponFired' events for audio/visual feedback systems.
 *
 * Following ADR-0001: ECS architecture for game entity management.
 */

import { Vector3 } from 'three'
import { Transform, Weapon } from '../components'
import { gameConfig } from '../config'
import type { ComponentClass, EntityId, World as IWorld, System } from '../ecs/types'
import { createProjectile } from '../entities/createProjectile'
import type { InputSystem } from './InputSystem'

// Type assertions for component classes to work with ECS type system
const TransformClass = Transform as unknown as ComponentClass<Transform>
const WeaponClass = Weapon as unknown as ComponentClass<Weapon>

/**
 * Event emitted when a weapon fires.
 * Used by AudioSystem and ParticleSystem for feedback.
 */
export interface WeaponFiredEvent {
  type: 'weaponFired'
  weaponType: string
  position: Vector3
  direction: Vector3
}

/**
 * WeaponSystem - handles weapon firing logic for entities with Weapon components.
 *
 * Queries for entities with Weapon and Transform components, checks for fire input,
 * and creates projectiles when cooldown allows.
 */
export class WeaponSystem implements System {
  /** Input system reference for reading fire action */
  private inputSystem: InputSystem

  /** Cumulative time in milliseconds for cooldown tracking */
  private currentTime = 0

  /** Events emitted this frame (cleared each update) */
  private events: WeaponFiredEvent[] = []

  /**
   * Create a WeaponSystem instance.
   *
   * @param inputSystem - InputSystem for reading fire action state
   */
  constructor(inputSystem: InputSystem) {
    this.inputSystem = inputSystem
  }

  /**
   * Update weapon system - check for fire input and create projectiles.
   *
   * @param world - The ECS world instance
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(world: IWorld, deltaTime: number): void {
    // Update cumulative time for cooldown tracking
    this.currentTime += deltaTime

    // Clear events from previous frame
    this.events = []

    // Check if fire action is active (spacebar pressed)
    const shouldFire = this.inputSystem.hasAction('shoot')

    if (!shouldFire) {
      return
    }

    // Query for entities with Weapon and Transform components
    const entities = world.query(TransformClass, WeaponClass)

    for (const entityId of entities) {
      const transform = world.getComponent(entityId, TransformClass)
      const weapon = world.getComponent(entityId, WeaponClass)

      // Safety check - components should exist from query
      if (!transform || !weapon) {
        continue
      }

      // Check if weapon can fire (cooldown expired)
      if (!weapon.canFire(this.currentTime)) {
        continue
      }

      // Fire the weapon
      this.fireWeapon(world, entityId, transform, weapon)

      // Record fire time for cooldown
      weapon.recordFire(this.currentTime)

      // Emit event for audio/visual feedback
      this.emitWeaponFiredEvent(weapon, transform)
    }
  }

  /**
   * Fire the weapon and create a projectile entity.
   *
   * @param world - The ECS world
   * @param shipId - Entity ID of the ship firing
   * @param transform - Transform component of the ship
   * @param weapon - Weapon component of the ship
   */
  private fireWeapon(world: IWorld, shipId: EntityId, transform: Transform, weapon: Weapon): void {
    // Get weapon configuration from game config
    const weaponConfig = gameConfig.weapons[weapon.currentWeapon]

    // Calculate ship's forward direction from rotation
    const direction = this.getShipForwardDirection(transform.rotation.z)

    // Calculate projectile spawn position (slightly ahead of ship)
    const spawnDistance = 21 // Ship radius (20) + offset (1)
    const spawnOffset = direction.clone().multiplyScalar(spawnDistance)
    const projectilePosition = transform.position.clone().add(spawnOffset)

    // Create projectile entity
    createProjectile(world, {
      position: projectilePosition,
      direction: direction.clone(),
      type: weapon.currentWeapon,
      owner: shipId,
      damage: weaponConfig.damage,
      speed: weaponConfig.projectileSpeed
    })
  }

  /**
   * Get the ship's forward direction from Z rotation.
   *
   * Ship rotation convention:
   * - rotation.z = 0 -> facing +Y (up)
   * - rotation.z = PI/2 -> facing -X (left)
   * - rotation.z = PI -> facing -Y (down)
   * - rotation.z = 3*PI/2 -> facing +X (right)
   *
   * This matches the ShipControlSystem rotation convention.
   *
   * @param rotationZ - Z rotation in radians
   * @returns Normalized direction vector
   */
  private getShipForwardDirection(rotationZ: number): Vector3 {
    // Convert rotation to direction using sine/cosine
    // At rotation=0, ship faces +Y (up), so:
    // x = -sin(rotation), y = cos(rotation)
    const x = -Math.sin(rotationZ)
    const y = Math.cos(rotationZ)
    return new Vector3(x, y, 0).normalize()
  }

  /**
   * Emit a weaponFired event for audio/visual feedback.
   *
   * @param weapon - Weapon component
   * @param transform - Transform component
   */
  private emitWeaponFiredEvent(weapon: Weapon, transform: Transform): void {
    const event: WeaponFiredEvent = {
      type: 'weaponFired',
      weaponType: weapon.currentWeapon,
      position: transform.position.clone(),
      direction: this.getShipForwardDirection(transform.rotation.z)
    }
    this.events.push(event)
  }

  /**
   * Get events emitted during the last update.
   * Events are cleared at the start of each update.
   *
   * @returns Array of weapon fired events
   */
  getEvents(): WeaponFiredEvent[] {
    return this.events
  }
}
