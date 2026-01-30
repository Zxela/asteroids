---
id: "005"
title: "Add color data to powerup collected events"
status: pending
depends_on: ["001"]
test_file: tests/unit/PowerUpSystem.test.ts
---

# 005: Add color data to powerup collected events

## Objective

Enhance the powerUpCollected event to include color information for visual feedback systems. Each powerup type has an associated color that will be used for particle effects and screen flash.

## Acceptance Criteria

- [ ] PowerUpCollectedEventData includes `color: number` field (hex color)
- [ ] Shield powerup emits cyan (0x00ffff)
- [ ] RapidFire powerup emits orange (0xff8800)
- [ ] MultiShot powerup emits magenta (0xff00ff)
- [ ] ExtraLife powerup emits green (0x00ff00)
- [ ] `getPowerUpColor()` helper method added to PowerUpSystem
- [ ] Event type definition updated in types/events.ts

## Technical Notes

From TECHNICAL_DESIGN.md:
```typescript
interface PowerUpCollectedEventData {
  entityId: EntityId
  powerUpType: PowerUpType
  position: Vector3
  color: number  // Hex color for particles/flash
}

private getPowerUpColor(type: PowerUpType): number {
  const colors = {
    shield: 0x00ffff,    // Cyan
    rapidFire: 0xff8800, // Orange
    multiShot: 0xff00ff, // Magenta
    extraLife: 0x00ff00  // Green
  }
  return colors[type] ?? 0xffffff
}
```

These colors match the existing mesh colors in MeshFactory for visual consistency.

## Test Requirements

Add to `tests/unit/PowerUpSystem.test.ts`:
- Test each powerup type emits correct color in event
- Test event data structure includes all required fields
- Test getPowerUpColor returns correct hex values
- Test fallback color (0xffffff) for unknown types
