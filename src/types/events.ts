/**
 * Event Type Definitions
 *
 * Types for the game event system - events are used for decoupled
 * communication between systems.
 */

import type { Vector3 } from 'three'
import type { AsteroidSize, CollisionLayer, PowerUpType, WeaponType } from './components'
import type { EntityId } from './ecs'

// ============================================
// Game Event Types
// ============================================

/**
 * All game event type identifiers.
 */
export type GameEventType =
  | 'entityDestroyed'
  | 'collision'
  | 'powerUpCollected'
  | 'weaponFired'
  | 'weaponChanged'
  | 'waveComplete'
  | 'waveStarted'
  | 'bossSpawned'
  | 'bossPhaseChanged'
  | 'bossDefeated'
  | 'scoreChanged'
  | 'livesChanged'
  | 'shipDamaged'
  | 'shipThrust'
  | 'asteroidDestroyed'
  | 'playerDied'

/**
 * Base game event interface.
 */
export interface GameEvent<T extends GameEventType = GameEventType> {
  type: T
  timestamp: number
}

// ============================================
// Collision Events
// ============================================

/**
 * Collision event data - emitted when two entities collide.
 */
export interface CollisionEventData {
  entityA: EntityId
  entityB: EntityId
  layerA: CollisionLayer
  layerB: CollisionLayer
  position: Vector3
}

/**
 * Collision event type.
 */
export interface CollisionEvent extends GameEvent<'collision'> {
  data: CollisionEventData
}

// ============================================
// Entity Lifecycle Events
// ============================================

/**
 * Entity destroyed event data.
 */
export interface EntityDestroyedEventData {
  entityId: EntityId
  position: Vector3
  reason: 'collision' | 'lifetime' | 'manual'
}

/**
 * Entity destroyed event type.
 */
export interface EntityDestroyedEvent extends GameEvent<'entityDestroyed'> {
  data: EntityDestroyedEventData
}

// ============================================
// Asteroid Events
// ============================================

/**
 * Asteroid destroyed event data.
 */
export interface AsteroidDestroyedEventData {
  entityId: EntityId
  position: Vector3
  size: AsteroidSize
  points: number
  spawnChildren: boolean
}

/**
 * Asteroid destroyed event type.
 */
export interface AsteroidDestroyedEvent extends GameEvent<'asteroidDestroyed'> {
  data: AsteroidDestroyedEventData
}

// ============================================
// Weapon Events
// ============================================

/**
 * Weapon fired event data.
 */
export interface WeaponFiredEventData {
  entityId: EntityId
  weaponType: WeaponType
  position: Vector3
  direction: Vector3
}

/**
 * Weapon fired event type.
 */
export interface WeaponFiredEvent extends GameEvent<'weaponFired'> {
  data: WeaponFiredEventData
}

/**
 * Weapon changed event data.
 */
export interface WeaponChangedEventData {
  entityId: EntityId
  previousWeapon: WeaponType
  newWeapon: WeaponType
}

/**
 * Weapon changed event type.
 */
export interface WeaponChangedEvent extends GameEvent<'weaponChanged'> {
  data: WeaponChangedEventData
}

// ============================================
// Power-up Events
// ============================================

/**
 * Power-up collected event data.
 */
export interface PowerUpCollectedEventData {
  entityId: EntityId // Collecting entity
  powerUpEntityId: EntityId // Power-up entity
  powerUpType: PowerUpType
  position: Vector3
}

/**
 * Power-up collected event type.
 */
export interface PowerUpCollectedEvent extends GameEvent<'powerUpCollected'> {
  data: PowerUpCollectedEventData
}

// ============================================
// Wave Events
// ============================================

/**
 * Wave complete event data.
 */
export interface WaveCompleteEventData {
  wave: number
  score: number
  isBossWave: boolean
}

/**
 * Wave complete event type.
 */
export interface WaveCompleteEvent extends GameEvent<'waveComplete'> {
  data: WaveCompleteEventData
}

/**
 * Wave started event data.
 */
export interface WaveStartedEventData {
  wave: number
  asteroidCount: number
  speedMultiplier: number
  isBossWave: boolean
}

/**
 * Wave started event type.
 */
export interface WaveStartedEvent extends GameEvent<'waveStarted'> {
  data: WaveStartedEventData
}

// ============================================
// Boss Events
// ============================================

/**
 * Boss spawned event data.
 */
export interface BossSpawnedEventData {
  entityId: EntityId
  bossType: string
  health: number
  wave: number
}

/**
 * Boss spawned event type.
 */
export interface BossSpawnedEvent extends GameEvent<'bossSpawned'> {
  data: BossSpawnedEventData
}

/**
 * Boss phase changed event data.
 */
export interface BossPhaseChangedEventData {
  entityId: EntityId
  previousPhase: number
  newPhase: number
  healthPercentage: number
}

/**
 * Boss phase changed event type.
 */
export interface BossPhaseChangedEvent extends GameEvent<'bossPhaseChanged'> {
  data: BossPhaseChangedEventData
}

/**
 * Boss defeated event data.
 */
export interface BossDefeatedEventData {
  entityId: EntityId
  bossType: string
  wave: number
  bonusScore: number
}

/**
 * Boss defeated event type.
 */
export interface BossDefeatedEvent extends GameEvent<'bossDefeated'> {
  data: BossDefeatedEventData
}

// ============================================
// Score and Lives Events
// ============================================

/**
 * Score changed event data.
 */
export interface ScoreChangedEventData {
  previousScore: number
  newScore: number
  delta: number
  reason: string
}

/**
 * Score changed event type.
 */
export interface ScoreChangedEvent extends GameEvent<'scoreChanged'> {
  data: ScoreChangedEventData
}

/**
 * Lives changed event data.
 */
export interface LivesChangedEventData {
  previousLives: number
  newLives: number
  delta: number
  reason: 'damage' | 'extraLife' | 'respawn'
}

/**
 * Lives changed event type.
 */
export interface LivesChangedEvent extends GameEvent<'livesChanged'> {
  data: LivesChangedEventData
}

// ============================================
// Ship Events
// ============================================

/**
 * Ship damaged event data.
 */
export interface ShipDamagedEventData {
  entityId: EntityId
  damage: number
  source: EntityId
  remainingLives: number
}

/**
 * Ship damaged event type.
 */
export interface ShipDamagedEvent extends GameEvent<'shipDamaged'> {
  data: ShipDamagedEventData
}

/**
 * Ship thrust event data.
 */
export interface ShipThrustEventData {
  entityId: EntityId
  position: Vector3
  direction: Vector3
  active: boolean
}

/**
 * Ship thrust event type.
 */
export interface ShipThrustEvent extends GameEvent<'shipThrust'> {
  data: ShipThrustEventData
}

/**
 * Player died event data.
 */
export interface PlayerDiedEventData {
  finalScore: number
  waveReached: number
}

/**
 * Player died event type.
 */
export interface PlayerDiedEvent extends GameEvent<'playerDied'> {
  data: PlayerDiedEventData
}

// ============================================
// Event Union Type
// ============================================

/**
 * Union type of all game events for type-safe event handling.
 */
export type AnyGameEvent =
  | CollisionEvent
  | EntityDestroyedEvent
  | AsteroidDestroyedEvent
  | WeaponFiredEvent
  | WeaponChangedEvent
  | PowerUpCollectedEvent
  | WaveCompleteEvent
  | WaveStartedEvent
  | BossSpawnedEvent
  | BossPhaseChangedEvent
  | BossDefeatedEvent
  | ScoreChangedEvent
  | LivesChangedEvent
  | ShipDamagedEvent
  | ShipThrustEvent
  | PlayerDiedEvent

// ============================================
// Event Handler Types
// ============================================

/**
 * Generic event handler function type.
 */
export type EventHandler<T extends AnyGameEvent> = (event: T) => void

/**
 * Event subscriber map type for type-safe event subscription.
 */
export type EventSubscriberMap = {
  [K in GameEventType]?: EventHandler<Extract<AnyGameEvent, { type: K }>>[]
}
