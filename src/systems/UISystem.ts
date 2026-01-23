/**
 * UISystem - Bridges ECS world and HUD display
 *
 * Updates the HUD with game state from ECS components:
 * - Score and Lives from Player component
 * - Current weapon from Weapon component
 * - Wave number from WaveSystem state
 *
 * Following ADR-0001: ECS architecture for game entity management.
 *
 * @module systems/UISystem
 */

import { Player } from '../components/Player'
import { Weapon } from '../components/Weapon'
import type { ComponentClass, System, World } from '../ecs/types'
import type { ScoreChangedEvent } from '../types'
import type { HUD } from '../ui/HUD'

// Type assertion for component class to work with ECS type system
const PlayerClass = Player as unknown as ComponentClass<Player>
const WeaponClass = Weapon as unknown as ComponentClass<Weapon>

/**
 * System for updating HUD display from ECS game state.
 *
 * Queries the Player and Weapon components to update the HUD each frame.
 * Handles missing components gracefully by not updating the HUD.
 *
 * @example
 * ```typescript
 * const hud = new HUD()
 * const uiSystem = new UISystem(hud)
 * world.registerSystem(uiSystem)
 * // HUD will update from game state each frame
 * ```
 */
export class UISystem implements System {
  /** System type identifier */
  readonly systemType = 'ui' as const

  /** Reference to the HUD */
  private hud: HUD

  /** Score events from ScoreSystem (optional integration) */
  // Note: Score events stored for potential future animation/effect triggers
  private _scoreEvents: ScoreChangedEvent[] = []

  /** Current wave number (set externally by WaveSystem or Game) */
  private currentWave = 1

  /**
   * Creates a UISystem instance.
   *
   * @param hud - The HUD instance to update
   */
  constructor(hud: HUD) {
    this.hud = hud
  }

  /**
   * Sets score events from ScoreSystem.
   * Can be used for additional score change handling if needed.
   *
   * @param events - Array of score changed events
   */
  setScoreEvents(events: ScoreChangedEvent[]): void {
    this._scoreEvents = events
  }

  /**
   * Sets the current wave number for HUD display.
   *
   * @param wave - The current wave number
   */
  setCurrentWave(wave: number): void {
    this.currentWave = wave
  }

  /**
   * Updates the HUD from ECS game state.
   *
   * Queries for Player entity and updates score, lives, and weapon display.
   * Handles missing Player gracefully by skipping updates.
   *
   * @param world - The ECS world containing entities
   * @param _deltaTime - Time since last frame in milliseconds (unused)
   */
  update(world: World, _deltaTime: number): void {
    // Query for player entity
    const playerEntities = world.query(PlayerClass)

    if (playerEntities.length === 0) {
      // No player entity, skip updates
      return
    }

    // Get first player (single-player game)
    const playerId = playerEntities[0]
    if (playerId === undefined) {
      return
    }

    const player = world.getComponent(playerId, PlayerClass)

    if (!player) {
      return
    }

    // Update score and lives from Player component
    this.hud.updateScore(player.score)
    this.hud.updateLives(player.lives)

    // Update wave display
    this.hud.updateWave(this.currentWave)

    // Update weapon from Weapon component (default to 'single' if not present)
    const weapon = world.getComponent(playerId, WeaponClass)
    if (weapon) {
      this.hud.updateWeapon(weapon.currentWeapon)
    } else {
      this.hud.updateWeapon('single')
    }

    // Clear processed events
    this._scoreEvents = []
  }

  /**
   * Gets the HUD instance for external access (e.g., visibility control).
   *
   * @returns The HUD instance
   */
  getHUD(): HUD {
    return this.hud
  }

  /**
   * Gets the pending score events.
   * Can be used for animations or other effects on score changes.
   *
   * @returns Array of score changed events
   */
  getScoreEvents(): ScoreChangedEvent[] {
    return this._scoreEvents
  }
}
