---
id: "007"
title: "Add screen flash on powerup collection"
status: pending
depends_on: ["005"]
test_file: tests/unit/Game.test.ts
---

# 007: Add screen flash on powerup collection

## Objective

Add a brief screen flash/tint effect when collecting powerups. This provides immediate feedback and reinforces the powerup's color identity.

## Acceptance Criteria

- [ ] Flash overlay div created and added to DOM
- [ ] Overlay covers entire screen with pointer-events: none
- [ ] Flash triggered on powerUpCollected event
- [ ] Flash color matches powerup color from event
- [ ] Flash opacity peaks at 0.3 (subtle, not blinding)
- [ ] Flash duration is 100ms
- [ ] Flash fades out smoothly via CSS transition

## Technical Notes

From TECHNICAL_DESIGN.md:
```typescript
private flashOverlay: HTMLElement | null = null

private setupFlashOverlay(): void {
  this.flashOverlay = document.createElement('div')
  this.flashOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.1s;
  `
  document.body.appendChild(this.flashOverlay)
}

private flashScreen(color: number, duration = 100): void {
  if (!this.flashOverlay) return
  const hex = '#' + color.toString(16).padStart(6, '0')
  this.flashOverlay.style.backgroundColor = hex
  this.flashOverlay.style.opacity = '0.3'
  setTimeout(() => {
    this.flashOverlay!.style.opacity = '0'
  }, duration)
}
```

From PRD.md US-2:
- Brief screen flash/tint matching powerup color

## Test Requirements

Add to `tests/unit/Game.test.ts`:
- Test flashOverlay element is created
- Test flashScreen sets correct background color
- Test flashScreen sets opacity to 0.3
- Test opacity returns to 0 after duration
