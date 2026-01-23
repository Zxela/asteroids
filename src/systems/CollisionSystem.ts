/**
 * CollisionSystem - Collision detection with broad and narrow phase
 *
 * Implements efficient collision detection using:
 * - Broad phase: SpatialGrid to reduce candidate pairs
 * - Narrow phase: Circle-circle collision test
 * - Layer/mask filtering for collision rules
 *
 * Performance target: <5ms for 50 entities at 60 FPS.
 *
 * @module systems/CollisionSystem
 */

import type { Vector3 } from 'three'
import { Collider } from '../components/Collider'
import { Transform } from '../components/Transform'
import { gameConfig } from '../config/gameConfig'
import type { ComponentClass, EntityId, System, World } from '../ecs/types'
import type { CollisionLayer } from '../types/components'
import { SpatialGrid } from '../utils/SpatialGrid'

// Type assertions for component classes to work with ECS type system
// Runtime behavior is correct; this bridges TypeScript's stricter type checking
const TransformClass = Transform as unknown as ComponentClass<Transform>
const ColliderClass = Collider as unknown as ComponentClass<Collider>

/**
 * Collision event data emitted when two entities collide.
 */
export interface CollisionEvent {
  /** Event type identifier */
  type: 'collision'
  /** First entity in collision */
  entity1: EntityId
  /** Second entity in collision */
  entity2: EntityId
  /** Layer of first entity */
  layer1: CollisionLayer
  /** Layer of second entity */
  layer2: CollisionLayer
  /** Distance between entity centers */
  distance: number
}

/**
 * System for detecting collisions between entities.
 *
 * Uses a two-phase collision detection approach:
 * 1. Broad phase: SpatialGrid reduces O(n^2) to O(n*k) comparisons
 * 2. Narrow phase: Circle-circle collision test for accuracy
 *
 * Collision rules are determined by layer/mask filtering:
 * - Each collider has a layer (what it is)
 * - Each collider has a mask (what it can collide with)
 * - Both masks must include the other's layer for collision
 *
 * @example
 * ```typescript
 * const collisionSystem = new CollisionSystem()
 * world.registerSystem(collisionSystem)
 *
 * // Each frame in game loop
 * collisionSystem.update(world, deltaTime)
 *
 * // Process collisions
 * const collisions = collisionSystem.getCollisions()
 * ```
 */
export class CollisionSystem implements System {
  /** System type identifier */
  readonly systemType = 'collision' as const

  /** Required components for collision detection */
  readonly requiredComponents = ['transform', 'collider']

  private spatialGrid: SpatialGrid
  private collisions: CollisionEvent[] = []
  private lastFrameTime = 0

  /**
   * Create a new CollisionSystem.
   *
   * Initializes the spatial grid with cell size from game config.
   */
  constructor() {
    this.spatialGrid = new SpatialGrid({
      cellSize: gameConfig.performance.collisionBroadPhaseGridSize,
      width: 1920,
      height: 1080
    })
  }

  /**
   * Update collision detection for all collidable entities.
   *
   * Performs broad phase spatial partitioning followed by narrow phase
   * circle-circle collision testing for potential collision pairs.
   *
   * @param world - The ECS world containing entities
   * @param _deltaTime - Time since last frame (unused but part of System interface)
   */
  update(world: World, _deltaTime: number): void {
    const startTime = performance.now()

    // Clear state for new frame
    this.spatialGrid.clear()
    this.collisions = []

    // Query all entities with both Transform and Collider components
    const collidables = world.query(TransformClass, ColliderClass)

    // Build spatial grid (broad phase)
    for (const entityId of collidables) {
      const transform = world.getComponent<Transform>(entityId, TransformClass)
      const collider = world.getComponent<Collider>(entityId, ColliderClass)

      if (transform && collider && this.isColliderEnabled(collider)) {
        this.spatialGrid.insert(entityId, transform.position, collider.radius ?? 20)
      }
    }

    // Track tested pairs to avoid duplicates
    const testedPairs = new Set<string>()

    // Narrow phase collision detection
    for (const entityId1 of collidables) {
      const collider1 = world.getComponent<Collider>(entityId1, ColliderClass)
      const transform1 = world.getComponent<Transform>(entityId1, TransformClass)

      if (!collider1 || !transform1 || !this.isColliderEnabled(collider1)) {
        continue
      }

      // Query nearby entities from spatial grid
      const nearby = this.spatialGrid.query(transform1.position, collider1.radius ?? 20)

      for (const entityId2 of nearby) {
        // Skip self-collision
        if ((entityId1 as number) >= (entityId2 as number)) {
          continue
        }

        // Skip already tested pairs
        const pairKey = this.getPairKey(entityId1, entityId2)
        if (testedPairs.has(pairKey)) {
          continue
        }
        testedPairs.add(pairKey)

        const collider2 = world.getComponent<Collider>(entityId2, ColliderClass)
        const transform2 = world.getComponent<Transform>(entityId2, TransformClass)

        if (!collider2 || !transform2 || !this.isColliderEnabled(collider2)) {
          continue
        }

        // Check layer/mask compatibility
        if (!this.canCollide(collider1, collider2)) {
          continue
        }

        // Narrow phase: circle-circle collision test
        const collision = this.testCircleCollision(
          transform1.position,
          collider1.radius ?? 1,
          transform2.position,
          collider2.radius ?? 1
        )

        if (collision) {
          this.collisions.push({
            type: 'collision',
            entity1: entityId1,
            entity2: entityId2,
            layer1: collider1.layer,
            layer2: collider2.layer,
            distance: collision.distance
          })
        }
      }
    }

    // Track performance
    const endTime = performance.now()
    this.lastFrameTime = endTime - startTime

    // Warn if exceeding budget
    if (this.lastFrameTime > 5) {
      console.warn(`Collision detection exceeded budget: ${this.lastFrameTime.toFixed(2)}ms`)
    }
  }

  /**
   * Check if a collider is enabled.
   *
   * @param collider - The collider to check
   * @returns True if collider should participate in collision detection
   */
  private isColliderEnabled(collider: Collider): boolean {
    // Check if enabled property exists and is false
    return collider.enabled !== false
  }

  /**
   * Generate a unique key for an entity pair.
   *
   * @param id1 - First entity ID
   * @param id2 - Second entity ID
   * @returns Consistent string key regardless of ID order
   */
  private getPairKey(id1: EntityId, id2: EntityId): string {
    const minId = Math.min(id1 as number, id2 as number)
    const maxId = Math.max(id1 as number, id2 as number)
    return `${minId},${maxId}`
  }

  /**
   * Check if two colliders can collide based on layer/mask rules.
   *
   * Both colliders must include the other's layer in their mask
   * for a collision to be registered.
   *
   * @param collider1 - First collider
   * @param collider2 - Second collider
   * @returns True if collision should be checked
   */
  private canCollide(collider1: Collider, collider2: Collider): boolean {
    // Check if layer1 is in mask2 AND layer2 is in mask1
    const layer1InMask2 = collider2.mask.includes(collider1.layer)
    const layer2InMask1 = collider1.mask.includes(collider2.layer)

    return layer1InMask2 && layer2InMask1
  }

  /**
   * Test for circle-circle collision (2.5D - ignores Z-axis).
   *
   * Two circles collide when the distance between their centers
   * is less than the sum of their radii.
   *
   * @param pos1 - First circle center
   * @param radius1 - First circle radius
   * @param pos2 - Second circle center
   * @param radius2 - Second circle radius
   * @returns Collision data if colliding, null otherwise
   */
  private testCircleCollision(
    pos1: Vector3,
    radius1: number,
    pos2: Vector3,
    radius2: number
  ): { distance: number } | null {
    // 2.5D collision - ignore Z-axis
    const dx = pos2.x - pos1.x
    const dy = pos2.y - pos1.y
    const distanceSquared = dx * dx + dy * dy

    const minDistance = radius1 + radius2
    const minDistanceSquared = minDistance * minDistance

    // Collision if distance < sum of radii (not equal)
    if (distanceSquared < minDistanceSquared) {
      const distance = Math.sqrt(distanceSquared)
      return { distance }
    }

    return null
  }

  /**
   * Get all collisions detected in the current frame.
   *
   * @returns Array of collision events
   */
  getCollisions(): CollisionEvent[] {
    return this.collisions
  }

  /**
   * Get the number of collisions detected in the current frame.
   *
   * @returns Collision count
   */
  getCollisionCount(): number {
    return this.collisions.length
  }

  /**
   * Get the time taken for collision detection in the last frame.
   *
   * @returns Time in milliseconds
   */
  getLastFrameTime(): number {
    return this.lastFrameTime
  }
}
