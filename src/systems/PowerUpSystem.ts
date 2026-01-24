/**
 * PowerUpSystem - Power-up Collection and Effect Management
 *
 * Handles power-up collection when player collides with power-up entities.
 * Manages active power-up effects with timer-based expiration.
 *
 * Effects:
 * - Shield: Grants invulnerability for 10 seconds
 * - RapidFire: Halves weapon cooldown for 15 seconds
 * - MultiShot: Enables triple projectile spread for 15 seconds
 * - ExtraLife: Instantly grants +1 life (permanent)
 *
 * @module systems/PowerUpSystem
 */

import { Vector3 } from 'three'
import { Health } from '../components/Health'
import { Lifetime } from '../components/Lifetime'
import { Player } from '../components/Player'
import { PowerUp } from '../components/PowerUp'
import { PowerUpEffect } from '../components/PowerUpEffect'
import { Transform } from '../components/Transform'
import { Weapon } from '../components/Weapon'
import { POWER_UP_CONFIGS } from '../config/powerUpConfig'
import type { ComponentClass, EntityId, System, World } from '../ecs/types'
import type { PowerUpType } from '../types/components'
import type { PowerUpCollectedEvent, PowerUpCollectedEventData } from '../types/events'
import type { CollisionEvent } from './CollisionSystem'

// Type assertions for component classes to work with ECS type system
const PlayerClass = Player as unknown as ComponentClass<Player>
const PowerUpClass = PowerUp as unknown as ComponentClass<PowerUp>
const PowerUpEffectClass = PowerUpEffect as unknown as ComponentClass<PowerUpEffect>
const HealthClass = Health as unknown as ComponentClass<Health>
const WeaponClass = Weapon as unknown as ComponentClass<Weapon>
const TransformClass = Transform as unknown as ComponentClass<Transform>
const LifetimeClass = Lifetime as unknown as ComponentClass<Lifetime>

/**
 * System for managing power-up collection and effect application.
 *
 * Features:
 * - Collision detection between player and power-up entities
 * - Effect application based on power-up type
 * - Timer-based effect expiration
 * - Effect refresh on duplicate collection
 *
 * @example
 * ```typescript
 * const powerUpSystem = new PowerUpSystem()
 * world.registerSystem(powerUpSystem)
 *
 * // Each frame
 * powerUpSystem.setCollisions(collisionSystem.getCollisions())
 * powerUpSystem.update(world, deltaTime)
 *
 * // Check if player has active effect
 * if (powerUpSystem.hasActiveEffect(playerId, 'shield')) {
 *   // Player is shielded
 * }
 * ```
 */
export class PowerUpSystem implements System {
  /** System type identifier */
  readonly systemType = 'powerUp' as const

  /** Collision events from CollisionSystem */
  private collisions: CollisionEvent[] = []

  /** Power-up collected events emitted this frame */
  private events: PowerUpCollectedEvent[] = []

  /** Reference to the world for hasActiveEffect queries */
  private currentWorld: World | null = null

  /**
   * Set collision events for this frame.
   *
   * @param collisions - Array of collision events from CollisionSystem
   */
  setCollisions(collisions: CollisionEvent[]): void {
    this.collisions = collisions
  }

  /**
   * Get power-up collected events emitted this frame.
   *
   * @returns Array of power-up collected events
   */
  getEvents(): PowerUpCollectedEvent[] {
    return this.events
  }

  /**
   * Update power-up system.
   *
   * 1. Process collisions to collect power-ups
   * 2. Update effect timers
   * 3. Remove expired effects
   *
   * @param world - The ECS world
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(world: World, deltaTime: number): void {
    this.currentWorld = world
    this.events = []

    // Update power-up lifetimes and destroy expired ones
    this.updatePowerUpLifetimes(world, deltaTime)

    // Process collisions for power-up collection
    this.processCollisions(world)

    // Update effect timers and handle expiration
    this.updateEffectTimers(world, deltaTime)
  }

  /**
   * Update power-up lifetimes and destroy expired power-ups.
   */
  private updatePowerUpLifetimes(world: World, deltaTime: number): void {
    const powerUps = world.query(PowerUpClass, LifetimeClass)

    for (const powerUpId of powerUps) {
      const lifetime = world.getComponent(powerUpId, LifetimeClass)
      if (!lifetime) continue

      // Decrement lifetime
      lifetime.remaining -= deltaTime

      // Destroy if expired
      if (lifetime.remaining <= 0) {
        world.destroyEntity(powerUpId)
      }
    }
  }

  /**
   * Process collision events for power-up collection.
   */
  private processCollisions(world: World): void {
    for (const collision of this.collisions) {
      // Check if this is a player-powerup collision
      const { playerId, powerUpId } = this.identifyCollisionEntities(world, collision)

      if (playerId !== null && powerUpId !== null) {
        this.collectPowerUp(world, playerId, powerUpId)
      }
    }
  }

  /**
   * Identify player and power-up entities from a collision.
   */
  private identifyCollisionEntities(
    world: World,
    collision: CollisionEvent
  ): { playerId: EntityId | null; powerUpId: EntityId | null } {
    let playerId: EntityId | null = null
    let powerUpId: EntityId | null = null

    // Check entity1
    if (
      collision.layer1 === 'player' &&
      world.isEntityAlive(collision.entity1) &&
      world.hasComponent(collision.entity1, PlayerClass)
    ) {
      playerId = collision.entity1
    } else if (
      collision.layer1 === 'powerup' &&
      world.isEntityAlive(collision.entity1) &&
      world.hasComponent(collision.entity1, PowerUpClass)
    ) {
      powerUpId = collision.entity1
    }

    // Check entity2
    if (
      collision.layer2 === 'player' &&
      world.isEntityAlive(collision.entity2) &&
      world.hasComponent(collision.entity2, PlayerClass)
    ) {
      playerId = collision.entity2
    } else if (
      collision.layer2 === 'powerup' &&
      world.isEntityAlive(collision.entity2) &&
      world.hasComponent(collision.entity2, PowerUpClass)
    ) {
      powerUpId = collision.entity2
    }

    return { playerId, powerUpId }
  }

  /**
   * Collect a power-up and apply its effect.
   */
  private collectPowerUp(world: World, playerId: EntityId, powerUpId: EntityId): void {
    // Get power-up type
    const powerUpComponent = world.getComponent(powerUpId, PowerUpClass)
    if (!powerUpComponent) return

    const powerUpType = powerUpComponent.powerUpType

    // Get power-up position for event
    const transform = world.getComponent(powerUpId, TransformClass)
    const position = transform?.position.clone()

    // Apply effect
    this.applyEffect(world, playerId, powerUpType)

    // Emit event
    // Type assertion needed due to branded EntityId type mismatch between ecs/types and types/ecs
    const eventData = {
      entityId: playerId,
      powerUpEntityId: powerUpId,
      powerUpType,
      position: position ?? new Vector3(0, 0, 0)
    } as unknown as PowerUpCollectedEventData

    this.events.push({
      type: 'powerUpCollected',
      timestamp: Date.now(),
      data: eventData
    })

    // Remove power-up entity
    world.destroyEntity(powerUpId)
  }

  /**
   * Apply a power-up effect to an entity.
   *
   * @param world - The ECS world
   * @param entityId - Entity to apply effect to
   * @param powerUpType - Type of power-up effect
   */
  applyEffect(world: World, entityId: EntityId, powerUpType: PowerUpType): void {
    const config = POWER_UP_CONFIGS[powerUpType]

    // Handle instant effects (extraLife)
    if (powerUpType === 'extraLife') {
      const player = world.getComponent(entityId, PlayerClass)
      if (player) {
        player.lives += 1
      }
      return
    }

    // Get or create PowerUpEffectComponent
    let effectComponent = world.getComponent(entityId, PowerUpEffectClass)
    if (!effectComponent) {
      effectComponent = new PowerUpEffect()
      world.addComponent(entityId, effectComponent)
    }

    // Add or refresh effect
    effectComponent.addEffect(powerUpType, config.duration)

    // Apply immediate effect modifications
    this.applyImmediateEffect(world, entityId, powerUpType, effectComponent)
  }

  /**
   * Apply immediate effect modifications to entity components.
   */
  private applyImmediateEffect(
    world: World,
    entityId: EntityId,
    powerUpType: PowerUpType,
    effectComponent: PowerUpEffect
  ): void {
    switch (powerUpType) {
      case 'shield': {
        const health = world.getComponent(entityId, HealthClass)
        if (health) {
          health.invulnerable = true
        }
        break
      }
      case 'rapidFire': {
        const weapon = world.getComponent(entityId, WeaponClass)
        if (weapon) {
          // Store original cooldown if not already stored
          effectComponent.storeOriginalValue('weaponCooldown', weapon.cooldown)
          // Halve the cooldown
          const originalCooldown =
            effectComponent.getOriginalValue('weaponCooldown') ?? weapon.cooldown
          weapon.cooldown = originalCooldown / 2
        }
        break
      }
      case 'multiShot': {
        // MultiShot effect is tracked via hasActiveEffect()
        // WeaponSystem will check this flag to determine projectile pattern
        break
      }
    }
  }

  /**
   * Remove an effect and revert modifications.
   *
   * @param world - The ECS world
   * @param entityId - Entity to remove effect from
   * @param powerUpType - Type of power-up effect
   */
  removeEffect(world: World, entityId: EntityId, powerUpType: PowerUpType): void {
    const effectComponent = world.getComponent(entityId, PowerUpEffectClass)
    if (!effectComponent) return

    // Revert modifications
    this.revertEffect(world, entityId, powerUpType, effectComponent)

    // Remove effect from component
    effectComponent.removeEffect(powerUpType)
  }

  /**
   * Revert effect modifications when effect expires.
   */
  private revertEffect(
    world: World,
    entityId: EntityId,
    powerUpType: PowerUpType,
    effectComponent: PowerUpEffect
  ): void {
    switch (powerUpType) {
      case 'shield': {
        const health = world.getComponent(entityId, HealthClass)
        if (health) {
          health.invulnerable = false
        }
        break
      }
      case 'rapidFire': {
        const weapon = world.getComponent(entityId, WeaponClass)
        if (weapon) {
          const originalCooldown = effectComponent.getOriginalValue('weaponCooldown')
          if (originalCooldown !== undefined) {
            weapon.cooldown = originalCooldown
          }
          effectComponent.clearOriginalValue('weaponCooldown')
        }
        break
      }
      case 'multiShot': {
        // MultiShot flag is cleared automatically when effect is removed
        break
      }
    }
  }

  /**
   * Update effect timers and handle expiration.
   */
  private updateEffectTimers(world: World, deltaTime: number): void {
    // Query all entities with PowerUpEffectComponent
    const entities = world.query(PowerUpEffectClass)

    for (const entityId of entities) {
      const effectComponent = world.getComponent(entityId, PowerUpEffectClass)
      if (!effectComponent) continue

      // Update timers and get expired effects
      const expiredEffects = effectComponent.updateTimers(deltaTime)

      // Revert expired effects
      for (const powerUpType of expiredEffects) {
        this.revertEffect(world, entityId, powerUpType, effectComponent)
      }
    }
  }

  /**
   * Check if an entity has an active power-up effect.
   *
   * @param entityId - Entity to check
   * @param powerUpType - Type of power-up effect
   * @returns True if effect is active
   */
  hasActiveEffect(entityId: EntityId, powerUpType: PowerUpType): boolean {
    if (!this.currentWorld) return false

    const effectComponent = this.currentWorld.getComponent(entityId, PowerUpEffectClass)
    if (!effectComponent) return false

    return effectComponent.hasEffect(powerUpType)
  }
}
