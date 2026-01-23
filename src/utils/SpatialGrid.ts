/**
 * SpatialGrid - Broad-phase collision detection optimization
 *
 * Implements a uniform grid spatial partitioning system for efficient
 * collision detection. Entities are inserted into grid cells based on
 * their position, and queries return only entities in nearby cells.
 *
 * Performance: Reduces collision checks from O(n^2) to O(n*k) where k
 * is the average number of entities in nearby cells.
 *
 * @module utils/SpatialGrid
 */

import type { Vector3 } from 'three'
import type { EntityId } from '../ecs/types'

/**
 * Configuration for SpatialGrid initialization.
 */
export interface SpatialGridConfig {
  /** Size of each grid cell in world units */
  cellSize: number
  /** Total width of the game area (for reference) */
  width: number
  /** Total height of the game area (for reference) */
  height: number
}

/**
 * Spatial grid for broad-phase collision detection.
 *
 * Uses a hash map for cell storage, supporting infinite world space
 * without pre-allocation. Entities spanning multiple cells are inserted
 * into all relevant cells based on their position and radius.
 *
 * @example
 * ```typescript
 * const grid = new SpatialGrid({ cellSize: 100, width: 1920, height: 1080 })
 *
 * // Insert entities
 * grid.insert(entityId, position, radius)
 *
 * // Query nearby entities
 * const nearby = grid.query(queryPosition, queryRadius)
 *
 * // Clear for next frame
 * grid.clear()
 * ```
 */
export class SpatialGrid {
  private grid: Map<string, Set<EntityId>> = new Map()
  private cellSize: number
  // Width and height stored for potential future use (e.g., boundary checks)
  private readonly worldWidth: number
  private readonly worldHeight: number

  /**
   * Create a new SpatialGrid.
   *
   * @param config - Grid configuration with cell size and dimensions
   */
  constructor(config: SpatialGridConfig) {
    this.cellSize = config.cellSize
    this.worldWidth = config.width
    this.worldHeight = config.height
  }

  /**
   * Get the world width configured for this grid.
   */
  getWorldWidth(): number {
    return this.worldWidth
  }

  /**
   * Get the world height configured for this grid.
   */
  getWorldHeight(): number {
    return this.worldHeight
  }

  /**
   * Insert an entity into the grid.
   *
   * The entity is inserted into all cells that could contain it based on
   * its position and radius. This ensures the entity is found by queries
   * from any direction.
   *
   * @param entityId - The entity to insert
   * @param position - World position of the entity
   * @param radius - Collision radius of the entity (default: 20)
   */
  insert(entityId: EntityId | number, position: Vector3, radius = 20): void {
    const cells = this.getCellsForPosition(position, radius)

    for (const cellKey of cells) {
      let cellEntities = this.grid.get(cellKey)
      if (!cellEntities) {
        cellEntities = new Set()
        this.grid.set(cellKey, cellEntities)
      }
      cellEntities.add(entityId as EntityId)
    }
  }

  /**
   * Query for entities near a position.
   *
   * Returns all entities in cells that could contain entities within
   * the query radius. Note: This is a broad-phase check - returned
   * entities should still be tested for actual collision.
   *
   * @param position - Query position
   * @param radius - Query radius
   * @returns Set of entity IDs in nearby cells
   */
  query(position: Vector3, radius: number): Set<EntityId> {
    const nearby = new Set<EntityId>()
    const cells = this.getCellsForPosition(position, radius)

    for (const cellKey of cells) {
      const cellEntities = this.grid.get(cellKey)
      if (cellEntities) {
        for (const entityId of cellEntities) {
          nearby.add(entityId)
        }
      }
    }

    return nearby
  }

  /**
   * Clear all entities from the grid.
   *
   * Should be called at the start of each frame before inserting
   * entities with updated positions.
   */
  clear(): void {
    this.grid.clear()
  }

  /**
   * Get the cell key for a given world position.
   *
   * @param x - Cell X coordinate
   * @param y - Cell Y coordinate
   * @returns String key for the cell
   */
  private getCellKey(x: number, y: number): string {
    return `${x},${y}`
  }

  /**
   * Get all cell keys that could contain an entity at position with radius.
   *
   * Calculates the range of cells the entity could overlap with based on
   * its position and radius, returning keys for all cells in that range.
   *
   * @param position - Entity position
   * @param radius - Entity radius
   * @returns Array of cell keys
   */
  private getCellsForPosition(position: Vector3, radius: number): string[] {
    const cells: string[] = []

    // Calculate the range of cells the entity could be in
    const minX = Math.floor((position.x - radius) / this.cellSize)
    const maxX = Math.floor((position.x + radius) / this.cellSize)
    const minY = Math.floor((position.y - radius) / this.cellSize)
    const maxY = Math.floor((position.y + radius) / this.cellSize)

    // Add all cells in the range
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        cells.push(this.getCellKey(x, y))
      }
    }

    return cells
  }

  /**
   * Get the number of entities in the grid.
   *
   * @returns Total entity count (may count entities in multiple cells)
   */
  getEntityCount(): number {
    let count = 0
    for (const cellEntities of this.grid.values()) {
      count += cellEntities.size
    }
    return count
  }

  /**
   * Get the number of active cells in the grid.
   *
   * @returns Number of cells containing entities
   */
  getCellCount(): number {
    return this.grid.size
  }
}
