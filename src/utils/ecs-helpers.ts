/**
 * ECS Helper Utilities
 *
 * Common patterns for querying the ECS world,
 * reducing boilerplate across system files.
 */

import { Player } from '../components/Player'
import { Transform } from '../components/Transform'
import { componentClass } from '../ecs/types'
import type { EntityId, World } from '../ecs/types'

const PlayerClass = componentClass(Player)
const TransformClass = componentClass(Transform)

/**
 * Result of a player entity query.
 */
export interface PlayerEntityResult {
  entityId: EntityId
  player: Player
  transform: Transform
}

/**
 * Find the player entity and return its core components.
 * Returns null if no player entity exists or components are missing.
 *
 * @param world - The ECS world to query
 * @returns Player entity data or null
 */
export function getPlayerEntity(world: World): PlayerEntityResult | null {
  const playerEntities = world.query(PlayerClass)

  if (playerEntities.length === 0) {
    return null
  }

  const entityId = playerEntities[0]
  if (entityId === undefined) {
    return null
  }

  const player = world.getComponent(entityId, PlayerClass)
  const transform = world.getComponent(entityId, TransformClass)

  if (!player || !transform) {
    return null
  }

  return { entityId, player, transform }
}
