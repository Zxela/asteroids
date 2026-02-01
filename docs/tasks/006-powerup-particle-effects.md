---
id: "006"
title: "Add particle burst on powerup collection"
status: pending
depends_on: ["005"]
test_file: tests/unit/ParticleSystem.test.ts
---

# 006: Add particle burst on powerup collection

## Objective

Create a satisfying particle burst effect when the player collects a powerup. The particles should match the powerup's color and burst outward from the collection point.

## Acceptance Criteria

- [ ] ParticleSystem listens for powerUpCollected events
- [ ] Particle burst created at powerup position
- [ ] Particles use the color from the event
- [ ] Burst parameters: 20 particles, speed 50, lifetime 500ms, size 3
- [ ] Particles radiate outward in all directions
- [ ] Effect is visible but not overwhelming

## Technical Notes

From TECHNICAL_DESIGN.md:
```typescript
private handlePowerUpCollected(event: PowerUpCollectedEvent): void {
  const { position, color } = event.data

  // Create burst of particles at collection point
  this.createParticleBurst({
    position,
    color,
    count: 20,
    speed: 50,
    lifetime: 500,
    size: 3
  })
}
```

The ParticleSystem likely already has particle creation methods for explosions - reuse that pattern but with powerup-specific parameters.

From PRD.md US-2:
- Particle burst effect on powerup collection

## Test Requirements

Add to `tests/unit/ParticleSystem.test.ts`:
- Test handlePowerUpCollected creates particles
- Test particles use correct color from event
- Test correct number of particles created (20)
- Test particles have correct lifetime (500ms)
