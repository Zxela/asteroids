/**
 * Component Type Definitions
 *
 * All component interfaces for the ECS architecture.
 * Components are pure data containers attached to entities.
 */

import type { Vector3 } from 'three'
import type { Component, EntityId } from './ecs'

// ============================================
// Transform and Physics Components
// ============================================

/**
 * Transform component - position, rotation, and scale in 3D space.
 * Uses Three.js Vector3 for compatibility with rendering system.
 */
export interface TransformComponent extends Component {
  readonly type: 'transform'
  position: Vector3
  rotation: Vector3 // Euler angles in radians
  scale: Vector3
}

/**
 * Velocity component - linear and angular velocity.
 */
export interface VelocityComponent extends Component {
  readonly type: 'velocity'
  linear: Vector3
  angular: Vector3
}

/**
 * Physics component - physics simulation properties.
 */
export interface PhysicsComponent extends Component {
  readonly type: 'physics'
  mass: number
  damping: number
  angularDamping: number
  maxSpeed: number
  wrapScreen: boolean
}

// ============================================
// Collision Components
// ============================================

/**
 * Collision layer type for filtering collisions.
 */
export type CollisionLayer =
  | 'player'
  | 'asteroid'
  | 'projectile'
  | 'powerup'
  | 'boss'
  | 'bossProjectile'

/**
 * Collider shape type.
 */
export type ColliderShape = 'sphere' | 'box'

/**
 * Collider component - collision detection properties.
 */
export interface ColliderComponent extends Component {
  readonly type: 'collider'
  shape: ColliderShape
  radius?: number // For sphere colliders
  size?: Vector3 // For box colliders
  layer: CollisionLayer
  mask: CollisionLayer[] // Layers this collider can collide with
}

// ============================================
// Health and Status Components
// ============================================

/**
 * Health component - entity health and invulnerability state.
 */
export interface HealthComponent extends Component {
  readonly type: 'health'
  current: number
  max: number
  invulnerable: boolean
  invulnerabilityTimer: number // Remaining time in milliseconds
}

// ============================================
// Rendering Components
// ============================================

/**
 * Mesh type identifiers for the rendering system.
 */
export type MeshType =
  | 'ship'
  | 'asteroid_large'
  | 'asteroid_medium'
  | 'asteroid_small'
  | 'projectile_default'
  | 'projectile_spread'
  | 'projectile_laser'
  | 'projectile_missile'
  | 'projectile_boss'
  | 'powerup_shield'
  | 'powerup_rapidfire'
  | 'powerup_multishot'
  | 'powerup_extralife'
  | 'boss_destroyer'
  | 'boss_carrier'

/**
 * Material type identifiers.
 */
export type MaterialType = 'standard' | 'emissive' | 'transparent'

/**
 * Renderable component - visual representation properties.
 */
export interface RenderableComponent extends Component {
  readonly type: 'renderable'
  meshType: MeshType
  material: MaterialType
  visible: boolean
  objectId?: string // Three.js Object3D uuid for scene sync
}

// ============================================
// Weapon Components
// ============================================

/**
 * Weapon type identifiers.
 */
export type WeaponType = 'single' | 'spread' | 'laser' | 'homing' | 'boss'

/**
 * Weapon component - weapon state and capabilities.
 */
export interface WeaponComponent extends Component {
  readonly type: 'weapon'
  currentWeapon: WeaponType
  cooldown: number // Cooldown duration in milliseconds
  lastFiredAt: number // Timestamp of last fire
  ammo: number | 'infinite' // Ammo count or infinite
  energy: number // Current energy level (for laser)
  maxEnergy: number // Maximum energy capacity
  energyRegenRate: number // Energy regeneration per second
}

/**
 * Weapon configuration for different weapon types.
 */
export interface WeaponConfig {
  type: WeaponType
  cooldown: number
  projectileSpeed: number
  damage: number
  ammo: number | 'infinite'
  energyCost?: number // Energy cost per shot (for laser)
}

// ============================================
// Projectile Components
// ============================================

/**
 * Projectile component - projectile behavior properties.
 */
export interface ProjectileComponent extends Component {
  readonly type: 'projectile'
  damage: number
  owner: EntityId // Entity that fired this projectile
  lifetime: number // Remaining lifetime in milliseconds
  homingTarget?: EntityId // Target entity for homing projectiles
}

// ============================================
// Player Components
// ============================================

/**
 * Player component - player-specific state.
 */
export interface PlayerComponent extends Component {
  readonly type: 'player'
  lives: number
  score: number
}

// ============================================
// Asteroid Components
// ============================================

/**
 * Asteroid size type.
 */
export type AsteroidSize = 'large' | 'medium' | 'small'

/**
 * Asteroid component - asteroid-specific properties.
 */
export interface AsteroidComponent extends Component {
  readonly type: 'asteroid'
  size: AsteroidSize
  points: number // Score points awarded when destroyed
}

// ============================================
// Boss Components
// ============================================

/**
 * Boss type identifiers.
 */
export type BossType = 'destroyer' | 'carrier'

/**
 * Boss attack pattern identifiers.
 */
export type AttackPattern = 'idle' | 'charge' | 'spray' | 'summon' | 'retreat'

/**
 * Boss component - boss-specific properties and AI state.
 */
export interface BossComponent extends Component {
  readonly type: 'boss'
  bossType: BossType
  phase: number // Current phase (1, 2, 3...)
  phaseTimer: number // Time remaining in current phase
  attackPattern: AttackPattern
}

// ============================================
// Power-up Components
// ============================================

/**
 * Power-up type identifiers.
 */
export type PowerUpType = 'shield' | 'rapidFire' | 'multiShot' | 'extraLife'

/**
 * Power-up component - identifies power-up type for pickup.
 */
export interface PowerUpComponent extends Component {
  readonly type: 'powerUp'
  powerUpType: PowerUpType
}

/**
 * Active power-up effect state.
 */
export interface ActivePowerUp {
  powerUpType: PowerUpType
  remainingTime: number // Remaining duration in milliseconds
  totalDuration: number // Original duration for UI display
}

/**
 * Power-up effect component - tracks active power-up effects on an entity.
 */
export interface PowerUpEffectComponent extends Component {
  readonly type: 'powerUpEffect'
  effects: ActivePowerUp[]
}

// ============================================
// Particle Components
// ============================================

/**
 * Particle emitter type identifiers.
 */
export type ParticleEmitterType = 'thrust' | 'explosion' | 'trail' | 'shield'

/**
 * Particle emitter component - particle effect properties.
 */
export interface ParticleEmitterComponent extends Component {
  readonly type: 'particleEmitter'
  emitterType: ParticleEmitterType
  active: boolean
  rate: number // Particles per second
  lifetime: number // Particle lifetime in milliseconds
}

// ============================================
// Lifetime Component
// ============================================

/**
 * Lifetime component - for entities that should despawn after a duration.
 */
export interface LifetimeComponent extends Component {
  readonly type: 'lifetime'
  remaining: number // Remaining time in milliseconds
}

// ============================================
// Component Union Type
// ============================================

/**
 * Union type of all game components for type-safe component handling.
 */
export type GameComponent =
  | TransformComponent
  | VelocityComponent
  | PhysicsComponent
  | ColliderComponent
  | HealthComponent
  | RenderableComponent
  | WeaponComponent
  | ProjectileComponent
  | PlayerComponent
  | AsteroidComponent
  | BossComponent
  | PowerUpComponent
  | PowerUpEffectComponent
  | ParticleEmitterComponent
  | LifetimeComponent
