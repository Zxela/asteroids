/**
 * Weapon System
 *
 * Handles weapon firing based on input (spacebar) and cooldown management.
 * Creates projectile entities when fire conditions are met:
 * - Spacebar action is active (from InputSystem)
 * - Weapon cooldown has expired
 *
 * Supports multiple weapon types:
 * - Single Shot: Default, single projectile
 * - Spread Shot: 3 projectiles in 15-degree spread
 * - Laser: Continuous beam with energy system
 * - Homing: (placeholder for Task 5.7)
 *
 * Weapon switching via:
 * - Number keys 1, 2, 3 for direct selection
 * - Z/X keys for cycling through weapons
 *
 * Emits 'weaponFired', 'weaponChanged', and 'laserFired' events.
 *
 * Following ADR-0001: ECS architecture for game entity management.
 */

import { Vector3 } from 'three'
import { Transform, Weapon } from '../components'
import { gameConfig } from '../config'
import { WEAPON_CONFIGS, getNextWeapon, getPreviousWeapon } from '../config/weaponConfig'
import type { ComponentClass, EntityId, World as IWorld, System } from '../ecs/types'
import { createProjectile } from '../entities/createProjectile'
import type { WeaponType } from '../types/components'
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
 * Event emitted when weapon is changed.
 */
export interface WeaponChangedEvent {
  type: 'weaponChanged'
  entityId: EntityId
  previousWeapon: WeaponType
  newWeapon: WeaponType
}

/**
 * Event emitted when laser fires (continuous).
 */
export interface LaserFiredEvent {
  type: 'laserFired'
  entityId: EntityId
  position: Vector3
  direction: Vector3
  damage: number
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

  /** Weapon changed events emitted this frame */
  private weaponChangedEvents: WeaponChangedEvent[] = []

  /** Laser fired events emitted this frame */
  private laserFiredEvents: LaserFiredEvent[] = []

  /** Track which weapon switch actions were processed (to prevent repeat) */
  private processedSwitchActions: Set<string> = new Set()

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
    this.weaponChangedEvents = []
    this.laserFiredEvents = []

    // Query for entities with Weapon and Transform components
    const entities = world.query(TransformClass, WeaponClass)

    for (const entityId of entities) {
      const transform = world.getComponent(entityId, TransformClass)
      const weapon = world.getComponent(entityId, WeaponClass)

      // Safety check - components should exist from query
      if (!transform || !weapon) {
        continue
      }

      // Process weapon switching first
      this.processWeaponSwitching(entityId, weapon)

      // Handle energy regeneration for laser (when not firing)
      const shouldFire = this.inputSystem.hasAction('shoot')
      const isLaserWeapon = weapon.currentWeapon === 'laser'

      if (isLaserWeapon) {
        if (shouldFire) {
          // Try to fire laser
          this.handleLaserFiring(world, entityId, transform, weapon)
        } else {
          // Regenerate energy when not firing
          this.regenerateEnergy(weapon)
        }
      } else {
        // Handle non-laser weapons
        if (shouldFire) {
          this.handleStandardFiring(world, entityId, transform, weapon)
        }
      }
    }

    // Clear processed switch actions at end of frame
    this.updateProcessedSwitchActions()
  }

  /**
   * Process weapon switching based on input.
   *
   * @param entityId - Entity ID
   * @param weapon - Weapon component
   */
  private processWeaponSwitching(entityId: EntityId, weapon: Weapon): void {
    const previousWeapon = weapon.currentWeapon
    let newWeapon: WeaponType | null = null

    // Direct selection via number keys
    if (
      this.inputSystem.hasAction('switchWeapon1') &&
      !this.processedSwitchActions.has('switchWeapon1')
    ) {
      newWeapon = 'single'
      this.processedSwitchActions.add('switchWeapon1')
    } else if (
      this.inputSystem.hasAction('switchWeapon2') &&
      !this.processedSwitchActions.has('switchWeapon2')
    ) {
      newWeapon = 'spread'
      this.processedSwitchActions.add('switchWeapon2')
    } else if (
      this.inputSystem.hasAction('switchWeapon3') &&
      !this.processedSwitchActions.has('switchWeapon3')
    ) {
      newWeapon = 'laser'
      this.processedSwitchActions.add('switchWeapon3')
    }

    // Cycling via Z/X keys
    if (
      this.inputSystem.hasAction('switchWeaponPrev') &&
      !this.processedSwitchActions.has('switchWeaponPrev')
    ) {
      newWeapon = getPreviousWeapon(weapon.currentWeapon)
      this.processedSwitchActions.add('switchWeaponPrev')
    } else if (
      this.inputSystem.hasAction('switchWeaponNext') &&
      !this.processedSwitchActions.has('switchWeaponNext')
    ) {
      newWeapon = getNextWeapon(weapon.currentWeapon)
      this.processedSwitchActions.add('switchWeaponNext')
    }

    // Apply weapon change if different from current
    if (newWeapon !== null && newWeapon !== previousWeapon) {
      weapon.currentWeapon = newWeapon

      // Update cooldown based on new weapon config
      const weaponConfig = WEAPON_CONFIGS[newWeapon]
      weapon.cooldown = weaponConfig.cooldown

      // Emit weapon changed event
      this.weaponChangedEvents.push({
        type: 'weaponChanged',
        entityId,
        previousWeapon,
        newWeapon
      })
    }
  }

  /**
   * Update processed switch actions - remove actions that are no longer active.
   */
  private updateProcessedSwitchActions(): void {
    const actionsToCheck: readonly [
      'switchWeapon1',
      'switchWeapon2',
      'switchWeapon3',
      'switchWeaponPrev',
      'switchWeaponNext'
    ] = ['switchWeapon1', 'switchWeapon2', 'switchWeapon3', 'switchWeaponPrev', 'switchWeaponNext']
    for (const action of actionsToCheck) {
      if (!this.inputSystem.hasAction(action)) {
        this.processedSwitchActions.delete(action)
      }
    }
  }

  /**
   * Handle standard (non-laser) weapon firing.
   *
   * @param world - The ECS world
   * @param entityId - Entity ID
   * @param transform - Transform component
   * @param weapon - Weapon component
   */
  private handleStandardFiring(
    world: IWorld,
    entityId: EntityId,
    transform: Transform,
    weapon: Weapon
  ): void {
    // Check if weapon can fire (cooldown expired)
    if (!weapon.canFire(this.currentTime)) {
      return
    }

    // Fire based on weapon type
    if (weapon.currentWeapon === 'spread') {
      this.fireSpreadShot(world, entityId, transform, weapon)
    } else {
      this.fireSingleShot(world, entityId, transform, weapon)
    }

    // Record fire time for cooldown
    weapon.recordFire(this.currentTime)

    // Emit event for audio/visual feedback
    this.emitWeaponFiredEvent(weapon, transform)
  }

  /**
   * Handle laser weapon firing (continuous beam with energy).
   *
   * @param world - The ECS world
   * @param entityId - Entity ID
   * @param transform - Transform component
   * @param weapon - Weapon component
   */
  private handleLaserFiring(
    _world: IWorld,
    entityId: EntityId,
    transform: Transform,
    weapon: Weapon
  ): void {
    const laserConfig = WEAPON_CONFIGS.laser
    const energyCost = laserConfig.energyCost ?? 10

    // Check if enough energy to fire
    if (weapon.energy < energyCost) {
      // Not enough energy, regenerate instead
      this.regenerateEnergy(weapon)
      return
    }

    // Drain energy
    weapon.energy -= energyCost

    // Get direction
    const direction = this.getShipForwardDirection(transform.rotation.z)

    // Emit laser fired event
    this.laserFiredEvents.push({
      type: 'laserFired',
      entityId,
      position: transform.position.clone(),
      direction: direction.clone(),
      damage: laserConfig.damage
    })
  }

  /**
   * Regenerate energy for laser weapon.
   *
   * @param weapon - Weapon component
   */
  private regenerateEnergy(weapon: Weapon): void {
    const laserConfig = WEAPON_CONFIGS.laser
    const energyRegen = laserConfig.energyRegen ?? 5
    const maxEnergy = laserConfig.maxEnergy ?? 100

    weapon.energy = Math.min(weapon.energy + energyRegen, maxEnergy)
  }

  /**
   * Fire a single shot projectile.
   *
   * @param world - The ECS world
   * @param shipId - Entity ID of the ship
   * @param transform - Transform component
   * @param weapon - Weapon component
   */
  private fireSingleShot(
    world: IWorld,
    shipId: EntityId,
    transform: Transform,
    weapon: Weapon
  ): void {
    const weaponConfig = gameConfig.weapons[weapon.currentWeapon]
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
   * Fire spread shot (3 projectiles in 15-degree spread).
   *
   * @param world - The ECS world
   * @param shipId - Entity ID of the ship
   * @param transform - Transform component
   * @param weapon - Weapon component
   */
  private fireSpreadShot(
    world: IWorld,
    shipId: EntityId,
    transform: Transform,
    _weapon: Weapon
  ): void {
    const weaponConfig = WEAPON_CONFIGS.spread
    const spreadAngle = (weaponConfig.spreadAngle ?? 15) * (Math.PI / 180) // Convert to radians
    const projectileCount = weaponConfig.projectileCount ?? 3

    const baseRotation = transform.rotation.z
    const spawnDistance = 21 // Ship radius (20) + offset (1)

    // Fire projectiles at different angles: center, -15deg, +15deg
    const angles = [0, -spreadAngle, spreadAngle]

    for (let i = 0; i < projectileCount; i++) {
      const angleOffset = angles[i] ?? 0
      const projectileRotation = baseRotation + angleOffset
      const direction = this.getShipForwardDirection(projectileRotation)

      // Calculate spawn position in the direction of this projectile
      const spawnOffset = direction.clone().multiplyScalar(spawnDistance)
      const projectilePosition = transform.position.clone().add(spawnOffset)

      createProjectile(world, {
        position: projectilePosition,
        direction: direction.clone(),
        type: 'spread',
        owner: shipId,
        damage: weaponConfig.damage,
        speed: weaponConfig.projectileSpeed
      })
    }
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

  /**
   * Get weapon changed events emitted during the last update.
   *
   * @returns Array of weapon changed events
   */
  getWeaponChangedEvents(): WeaponChangedEvent[] {
    return this.weaponChangedEvents
  }

  /**
   * Get laser fired events emitted during the last update.
   *
   * @returns Array of laser fired events
   */
  getLaserFiredEvents(): LaserFiredEvent[] {
    return this.laserFiredEvents
  }
}
