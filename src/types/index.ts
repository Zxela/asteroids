/**
 * Types Module - Central Export Point
 *
 * All TypeScript type definitions for the 3D Asteroids game.
 * Exports ECS types, component types, game state types, and event types.
 */

// ============================================
// Core ECS Types
// ============================================
export type {
  EntityId,
  ComponentType,
  Component,
  System,
  World
} from './ecs'

// ============================================
// Component Types
// ============================================
export type {
  // Transform and Physics
  TransformComponent,
  VelocityComponent,
  PhysicsComponent,
  // Collision
  CollisionLayer,
  ColliderShape,
  ColliderComponent,
  // Health
  HealthComponent,
  // Rendering
  MeshType,
  MaterialType,
  RenderableComponent,
  // Weapons
  WeaponType,
  WeaponComponent,
  WeaponConfig,
  // Projectiles
  ProjectileComponent,
  // Player
  PlayerComponent,
  // Asteroids
  AsteroidSize,
  AsteroidComponent,
  // Boss
  BossType,
  AttackPattern,
  BossComponent,
  // Power-ups
  PowerUpType,
  PowerUpComponent,
  ActivePowerUp,
  PowerUpEffectComponent,
  // Particles
  ParticleEmitterType,
  ParticleEmitterComponent,
  // Lifetime
  LifetimeComponent,
  // Union type
  GameComponent
} from './components'

// ============================================
// Game State Types
// ============================================
export type {
  // Game Flow
  GameFlowState,
  GameFlowEvent,
  StateTransition,
  // Game State
  GameStateData,
  // Settings
  GameSettings,
  // Leaderboard
  LeaderboardEntry,
  Leaderboard,
  // Input
  InputAction,
  InputState,
  // Performance
  PerformanceMetrics,
  // Logging
  LogLevel,
  LogEntry
} from './game'

// Re-export constants
export {
  DEFAULT_GAME_STATE,
  DEFAULT_GAME_SETTINGS,
  DEFAULT_LEADERBOARD
} from './game'

// ============================================
// Event Types
// ============================================
export type {
  // Event identifiers
  GameEventType,
  GameEvent,
  // Collision events
  CollisionEventData,
  CollisionEvent,
  // Entity events
  EntityDestroyedEventData,
  EntityDestroyedEvent,
  // Asteroid events
  AsteroidDestroyedEventData,
  AsteroidDestroyedEvent,
  // Weapon events
  WeaponFiredEventData,
  WeaponFiredEvent,
  WeaponChangedEventData,
  WeaponChangedEvent,
  // Power-up events
  PowerUpCollectedEventData,
  PowerUpCollectedEvent,
  // Wave events
  WaveCompleteEventData,
  WaveCompleteEvent,
  WaveStartedEventData,
  WaveStartedEvent,
  // Boss events
  BossSpawnedEventData,
  BossSpawnedEvent,
  BossPhaseChangedEventData,
  BossPhaseChangedEvent,
  BossDefeatedEventData,
  BossDefeatedEvent,
  // Score and lives events
  ScoreChangedEventData,
  ScoreChangedEvent,
  LivesChangedEventData,
  LivesChangedEvent,
  // Ship events
  ShipDamagedEventData,
  ShipDamagedEvent,
  ShipThrustEventData,
  ShipThrustEvent,
  PlayerDiedEventData,
  PlayerDiedEvent,
  // Event utilities
  AnyGameEvent,
  EventHandler,
  EventSubscriberMap
} from './events'
