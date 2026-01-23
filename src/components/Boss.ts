/**
 * Boss Component
 *
 * Boss-specific properties and AI state management.
 * Tracks boss type, current phase, and attack pattern.
 */

import type { AttackPattern, BossComponent, BossType } from '../types/components'

/**
 * Boss component class - defines boss behavior state.
 *
 * @example
 * ```typescript
 * const boss = new Boss('destroyer', 1, 0, 'idle')
 * boss.phase = 2  // Change to phase 2
 * boss.attackPattern = 'charge'  // Change attack pattern
 * ```
 */
export class Boss implements BossComponent {
  readonly type = 'boss' as const

  /** Type of boss (destroyer or carrier) */
  bossType: BossType

  /** Current phase (1, 2, or 3) based on health percentage */
  phase: number

  /** Timer for phase-based attack timing (milliseconds) */
  phaseTimer: number

  /** Current attack pattern name */
  attackPattern: AttackPattern

  /**
   * Create a Boss component.
   *
   * @param bossType - Type of boss ('destroyer' or 'carrier')
   * @param phase - Initial phase (default: 1)
   * @param phaseTimer - Initial phase timer (default: 0)
   * @param attackPattern - Initial attack pattern (default: 'idle')
   */
  constructor(
    bossType: BossType = 'destroyer',
    phase = 1,
    phaseTimer = 0,
    attackPattern: AttackPattern = 'idle'
  ) {
    this.bossType = bossType
    this.phase = phase
    this.phaseTimer = phaseTimer
    this.attackPattern = attackPattern
  }
}
