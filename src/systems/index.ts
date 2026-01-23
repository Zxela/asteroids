/**
 * Systems Module
 *
 * System implementations will be added as tasks progress.
 * Systems contain logic that operates on entities with specific components.
 */

export { InputSystem, type GameAction } from './InputSystem'
export { PhysicsSystem } from './PhysicsSystem'
export { ShipControlSystem } from './ShipControlSystem'
export { RenderSystem } from './RenderSystem'
export { CollisionSystem, type CollisionEvent } from './CollisionSystem'
export { WaveSystem } from './WaveSystem'
export {
  RespawnSystem,
  type PlayerDiedEvent,
  type ShipDamagedEvent,
  type RespawnSystemEvent
} from './RespawnSystem'
export { WeaponSystem, type WeaponFiredEvent } from './WeaponSystem'
export { ScoreSystem } from './ScoreSystem'
