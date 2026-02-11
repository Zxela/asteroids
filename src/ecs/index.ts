/**
 * ECS (Entity-Component-System) Module
 *
 * Core ECS infrastructure for the 3D Asteroids game.
 * Following ADR-0001: ECS architecture for game entity management.
 *
 * Exports:
 * - World: Main ECS orchestrator (public API)
 * - Types: EntityId, Component, System, ComponentClass
 * - Internal classes: EntityManager, ComponentStorage, SystemManager
 */

// Public API
export { World } from './World'

// Types
export type {
  EntityId,
  Component,
  System,
  ComponentClass,
  World as IWorld
} from './types'
export { componentClass } from './types'

// Internal classes (exported for testing and advanced use cases)
export { EntityManager } from './EntityManager'
export { ComponentStorage } from './ComponentStorage'
export { SystemManager } from './SystemManager'
