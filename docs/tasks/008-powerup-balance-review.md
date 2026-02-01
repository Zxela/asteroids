---
id: "008"
title: "Review and adjust powerup balance"
status: pending
depends_on: ["001", "006", "007"]
test_file: null
no_test_reason: "Configuration/balance changes - verified through gameplay testing"
---

# 008: Review and adjust powerup balance

## Objective

Review the current powerup configuration values and adjust for better gameplay balance. This ensures powerups feel impactful but don't trivialize the game.

## Acceptance Criteria

- [ ] Review spawn rate (currently 10%) - adjust if too frequent/rare
- [ ] Review Shield duration (currently 10s) - balanced against encounter rate
- [ ] Review RapidFire duration (currently 15s) and cooldown reduction (50%)
- [ ] Review MultiShot duration (currently 15s)
- [ ] Verify ExtraLife feels rewarding
- [ ] Test each powerup in actual gameplay
- [ ] Document any changes made with rationale

## Current Configuration

From `src/config/powerUpConfig.ts`:
```typescript
export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  shield: {
    duration: 10000,  // 10 seconds
    description: 'Temporary invulnerability'
  },
  rapidFire: {
    duration: 15000,  // 15 seconds
    description: 'Increased fire rate'
  },
  multiShot: {
    duration: 15000,  // 15 seconds
    description: 'Fire three projectiles'
  },
  extraLife: {
    duration: -1,     // Permanent
    description: 'Extra life'
  }
}

// Spawn chance in AsteroidDestructionSystem
const POWER_UP_SPAWN_CHANCE = 0.1  // 10%
```

## Balance Considerations

From PRD.md US-5:
- Spawn rate feels rewarding but not trivial
- Effect durations provide meaningful advantage
- Shield balanced against asteroid encounter rate
- RapidFire cooldown reduction feels noticeably faster

Questions to answer through playtesting:
1. How often do powerups spawn in a typical game? (10% of asteroids)
2. Is 10 seconds of invulnerability too long/short?
3. Does 15 seconds of rapid fire feel impactful?
4. Is the spread pattern for multiShot effective?

## Verification

Since this is a balance task, verification is through manual gameplay testing:
- Play 3-5 games focusing on powerup feel
- Note any frustrations or "too easy" moments
- Adjust values incrementally
- Re-test after changes
