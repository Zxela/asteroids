# Task: Bug Fix and Edge Case Testing

Metadata:
- Phase: 8 (Quality Assurance)
- Task: 8.6
- Dependencies: All previous phases (Phase 1-7 implementations complete)
- Provides: Bug fixes, edge case verification, gameplay polish
- Size: Medium (varies - bug fixes and documentation)
- Estimated Duration: 1 day

## Implementation Content

Comprehensive manual playtesting and edge case verification. Execute multiple complete game sessions through late waves and boss encounters. Systematically test edge cases: simultaneous collisions, rapid weapon switching, power-up overlap/expiration, boss defeat timing, screen wrapping, and high entity count scenarios. Document all bugs found, prioritize by severity, fix critical bugs, and verify no regressions. Final gameplay verification ensuring complete sessions playable without crashes.

*Reference dependencies: All game systems, gameplay mechanics, complete feature set*

## Target Files

- [ ] Various source files (bug fixes as needed)
- [ ] `docs/testing/bug-report.md` - Documented bugs and fixes
- [ ] `docs/testing/edge-case-verification.md` - Edge case test results

## Inline Context (REQUIRED - Prevents Re-fetching)

### Edge Case Categories

From Work Plan Phase 8 Task 8.6:

**Collision Edge Cases**:
- Multiple collisions simultaneously (ship hits asteroid while asteroid hits another asteroid)
- Collision with already-dead entity (edge of destruction animation)
- Collision during spawn invulnerability
- Screen wrapping collision detection (entity wraps while colliding)

**Weapon Edge Cases**:
- Rapid weapon switching (1→2→3→1 in quick succession)
- Fire while weapon switching
- Multiple projectiles same frame (spread shot)
- Weapon fire at screen edge (projectile spawns partially off-screen)
- Rapid spacebar taps (high frequency firing)

**Power-up Edge Cases**:
- Multiple power-ups overlap (ship collects 2+ simultaneously)
- Power-up expires mid-use (shield expires during collision)
- Collect power-up, immediately switch weapon (affects energy)
- Power-up spawns on existing asteroid (overlap)
- High entity count with power-up (performance)

**Boss Edge Cases**:
- Boss defeat during attack pattern
- Boss defeat with simultaneous enemy projectile
- Multiple shots hit boss same frame
- Boss health bar during rapid damage
- Boss appears at wave boundary

**Screen Wrapping Edge Cases**:
- Entity wraps during collision
- Projectile wraps and hits asteroid
- Ship wraps while firing
- Ship wraps during spawn invulnerability
- Boss at screen edge (doesn't wrap, but clips handling)

**High Entity Count Edge Cases**:
- 50+ asteroids on screen simultaneously
- Rapid asteroid destruction (cascade)
- Multiple projectiles hitting same asteroid
- Power-up spawns at max entity count
- FPS impact with many entities

**Game State Edge Cases**:
- Pause immediately after death
- Resume during respawn
- Game over during pause
- Boss spawn during pause
- Quick succession of wave changes

### Bug Severity Classification

**Critical** (Game-breaking):
- Game crash or freeze
- Physics breaks (infinite speed, stuck entities)
- Gameplay impossible (can't control ship, can't fire, can't pause)
- Complete feature failure

**High** (Major issues):
- Game unplayable after specific action
- Feature broken (weapon doesn't work, power-up doesn't apply)
- Significant visual artifacts
- Major performance drop (FPS <30)

**Medium** (Noticeable but playable):
- Minor visual glitches
- Occasional performance dip
- Specific condition causes issue but rare
- Workaround exists

**Low** (Polish):
- Visual polish missing
- Sound level issues
- Minor text issues
- Animation smoothness

### Testing Utilities and References

Similar testing approaches:
- `tests/e2e/asteroids.e2e.test.ts` - E2E test patterns
- Game configuration in `src/config/` - Entity limits, spawning
- System implementations - For understanding mechanics

### Key Constraints

From Work Plan:
- 3+ complete game sessions without crashes (requirement)
- No critical bugs acceptable for release
- Edge cases must be handled gracefully
- Game experience should be polished

## Implementation Steps (Manual Testing and Bug Triage)

### Phase 1: Full Game Session Playthroughs

**Session 1: Early Game**
- [ ] Start new game
- [ ] Play through waves 1-3
- [ ] Goals:
  - [ ] Game stable, no crashes
  - [ ] Ship controls responsive
  - [ ] Asteroids spawn and behave correctly
  - [ ] Weapon fires correctly
  - [ ] Collisions detected properly
  - [ ] Lives system works
  - [ ] Pause/resume works
- [ ] Observations: (document any anomalies)
- [ ] Note any unusual behavior or crashes

**Session 2: Mid Game**
- [ ] Continue same game or new game
- [ ] Play through waves 4-7
- [ ] Goals:
  - [ ] Wave progression smooth
  - [ ] Difficulty increase appropriate
  - [ ] No performance issues
  - [ ] Power-ups spawn and work
  - [ ] Audio plays correctly
- [ ] Observations: (document any issues)

**Session 3: Late Game with Boss**
- [ ] Continue or new game, target wave 10+
- [ ] Play through boss encounter(s)
- [ ] Goals:
  - [ ] Boss spawns at wave 5
  - [ ] Boss health bar visible and updates
  - [ ] Boss attack patterns execute
  - [ ] Boss takes damage and dies
  - [ ] Power-up guaranteed from boss
  - [ ] Wave progression after boss
  - [ ] Can reach late waves (10+) without crash
- [ ] Observations: (document any issues)

**Session 4: Post-Game Flow**
- [ ] Reach game over state (from any of above sessions)
- [ ] Goals:
  - [ ] Game over screen displays correctly
  - [ ] Score shows
  - [ ] Leaderboard button appears
  - [ ] Can submit score
  - [ ] Can start new game
  - [ ] Previous score persists in leaderboard
- [ ] Observations: (document any issues)

**Session Completion Summary**:
- [ ] Sessions completed: 1, 2, 3, 4 ✓
- [ ] Total crashes/freezes: 0 (if all pass)
- [ ] Major issues found: [list if any]

### Phase 2: Collision Edge Cases

**Multiple Simultaneous Collisions**:
- [ ] Scenario: Ship positioned near multiple asteroids
  - [ ] Manual gameplay: Navigate ship close to 2+ asteroids
  - [ ] Collide with multiple asteroids in same frame
  - [ ] Expected: Ship loses 1 life, asteroid collision handled correctly
  - [ ] Verify: No physics glitches, no multiple life loss

- [ ] Scenario: Projectile hits asteroid while asteroid hits ship
  - [ ] Fire projectile at asteroid
  - [ ] Asteroid simultaneously hits ship
  - [ ] Expected: Both collisions resolved, score updates, life decreases
  - [ ] Verify: No duplicate events, correct state

**Collision During Invulnerability**:
- [ ] Scenario: Ship respawns, touches asteroid during flash
  - [ ] Die, observe ship respawn with flashing
  - [ ] While flashing, drive into asteroid
  - [ ] Expected: Asteroid passes through ship (invulnerable)
  - [ ] Verify: Invulnerability timer works correctly

**Screen Wrapping Collision**:
- [ ] Scenario: Entity wraps while colliding
  - [ ] Position asteroid at screen edge
  - [ ] Push asteroid off-screen (wraps to other side)
  - [ ] While wrapping, collide with another asteroid
  - [ ] Expected: Wrapping and collision both handled
  - [ ] Verify: No physics glitches

### Phase 3: Weapon Edge Cases

**Rapid Weapon Switching**:
- [ ] Scenario: Switch weapons rapidly (1→2→3→1→2...)
  - [ ] Manual: Press 1, 2, 3, 1, 2 in rapid succession
  - [ ] Expected: Weapon indicator updates, no lag
  - [ ] Verify: Smooth switching, no crashes

**Fire While Switching**:
- [ ] Scenario: Fire while pressing weapon switch key
  - [ ] Press spacebar while switching weapon
  - [ ] Expected: Fire with current weapon, then switch
  - [ ] Verify: No duplicate projectiles, correct weapon fires

**High-Frequency Fire**:
- [ ] Scenario: Spam spacebar (rapid fire)
  - [ ] Press spacebar repeatedly at maximum rate
  - [ ] Expected: Weapon cooldown respected, projectiles spawn at rate
  - [ ] Verify: No stack overflow, object pooling works

**Laser Energy Edge Cases** (for laser weapon):
- [ ] Scenario: Laser fires at max entity count
  - [ ] Fill screen with asteroids, fire laser
  - [ ] Expected: Laser fires normally, no performance crash
  - [ ] Verify: Energy system works with high entity count

- [ ] Scenario: Switch weapons while laser firing
  - [ ] Fire laser (press 3 + spacebar)
  - [ ] While laser active, press weapon switch (1)
  - [ ] Expected: Laser stops, weapon switches to single
  - [ ] Verify: Energy stops draining, weapon switches immediately

### Phase 4: Power-up Edge Cases

**Multiple Power-ups Simultaneous**:
- [ ] Scenario: Spawn 2+ power-ups near each other
  - [ ] Play to point where power-ups spawn
  - [ ] Maneuver ship to collect multiple power-ups same area
  - [ ] Expected: Collect both, both effects apply
  - [ ] Verify: HUD shows active power-ups, effects stack/override correctly

**Power-up Expires During Use**:
- [ ] Scenario: Shield power-up expires during collision
  - [ ] Collect shield power-up (increased health/protection)
  - [ ] Wait until power-up about to expire
  - [ ] Drive into asteroid at expiry moment
  - [ ] Expected: Shield expires, collision damage taken normally
  - [ ] Verify: No glitch in health/lives system

**Power-up Spawn Overlap**:
- [ ] Scenario: Power-up spawns on asteroid
  - [ ] Play until power-up spawns near asteroid
  - [ ] If overlapping, collect power-up
  - [ ] Expected: Power-up collected, asteroid unaffected
  - [ ] Verify: No physics glitches from overlap

### Phase 5: Boss Edge Cases

**Boss Defeat During Attack**:
- [ ] Scenario: Kill boss while attack pattern executing
  - [ ] Reach boss fight, deal final damage during attack
  - [ ] Expected: Boss death handled, attack terminates
  - [ ] Verify: Wave progression correct, no leftover projectiles

**Boss with Simultaneous Damage**:
- [ ] Scenario: Hit boss multiple times in rapid succession
  - [ ] Fire multiple projectiles at boss
  - [ ] Hits register in same frame
  - [ ] Expected: Boss health decreases by total damage
  - [ ] Verify: Health bar updates correctly, no overshoot

**Boss at Screen Edge**:
- [ ] Scenario: Boss positioned at screen boundary
  - [ ] Play to boss encounter
  - [ ] Observe boss positioning (should stay centered or within bounds)
  - [ ] Expected: Boss doesn't wrap, stays visible
  - [ ] Verify: Boss behavior correct at edges

### Phase 6: Screen Wrapping Edge Cases

**Entity Wraps During Collision**:
- [ ] Scenario: Asteroid wraps while colliding
  - [ ] Position asteroid near screen edge
  - [ ] Fire projectile, asteroid wraps while being hit
  - [ ] Expected: Collision detected even with wrapping
  - [ ] Verify: Entity destroyed correctly

**Projectile Wraps and Hits**:
- [ ] Scenario: Fire projectile off-screen, wraps and hits asteroid
  - [ ] Position asteroid at opposite screen edge
  - [ ] Fire projectile across screen
  - [ ] Projectile wraps and hits asteroid
  - [ ] Expected: Collision detected post-wrap
  - [ ] Verify: Asteroid destroyed, score updates

### Phase 7: High Entity Count Edge Cases

**50+ Asteroids Simultaneous**:
- [ ] Scenario: Destroy asteroids in cascade to create 50+ entities
  - [ ] Play to wave with many asteroids
  - [ ] Destroy large asteroids to spawn many mediums/smalls
  - [ ] Expected: FPS stays 60+, no freezes
  - [ ] Verify: Entity pooling working, no memory leak

**Rapid Destruction Cascade**:
- [ ] Scenario: Chain destroy multiple asteroids
  - [ ] Fire spread shot or laser to hit multiple asteroids
  - [ ] Watch cascade of destructions
  - [ ] Expected: All collisions handled, performance stable
  - [ ] Verify: Particles spawn without lag, audio doesn't skip

### Phase 8: Game State Edge Cases

**Pause at Critical Moments**:
- [ ] Pause during asteroid destruction
  - [ ] Game pauses, can resume
  - [ ] Expected: State preserved, resume continues correctly
  - [ ] Verify: No physics skip or glitches

- [ ] Pause during boss fight
  - [ ] Pause mid-boss-attack
  - [ ] Resume
  - [ ] Expected: Boss state preserved, can continue
  - [ ] Verify: Boss AI resumes correctly

**Quick Game State Changes**:
- [ ] Scenario: Pause → Resume → Pause rapidly
  - [ ] Execute pause/resume 3-4 times rapidly
  - [ ] Expected: Game handles state transitions smoothly
  - [ ] Verify: No crashes, UI responsive

### Phase 9: Bug Documentation and Triage

- [ ] Create bug-report.md:
  - [ ] Format for each bug:
    ```markdown
    ## Bug [ID]: [Title]
    **Severity**: Critical/High/Medium/Low
    **Steps to Reproduce**:
    1. ...
    2. ...

    **Expected Behavior**: ...
    **Actual Behavior**: ...
    **Reproduction Rate**: Always/Sometimes/Rare
    **Screenshots/Video**: [if applicable]
    ```

- [ ] Document all bugs found during testing:
  - [ ] Session playthrough issues
  - [ ] Collision edge case failures
  - [ ] Weapon edge case failures
  - [ ] Power-up edge case failures
  - [ ] Boss edge case failures
  - [ ] Screen wrapping failures
  - [ ] High entity count issues
  - [ ] Game state failures

- [ ] Severity classification:
  - [ ] Critical: Game-breaking bugs (highest priority)
  - [ ] High: Major feature failures
  - [ ] Medium: Noticeable but playable
  - [ ] Low: Polish and minor issues

### Phase 10: Critical Bug Fixes

- [ ] For each CRITICAL bug:
  - [ ] Understand root cause
  - [ ] Identify affected system
  - [ ] Implement fix
  - [ ] Test fix in context (reproduce, verify fix works)
  - [ ] Re-test related scenarios (regression check)
  - [ ] Commit: `git commit -m "fix: [critical bug description]"`

- [ ] For each HIGH bug:
  - [ ] Assess feasibility of fix
  - [ ] Implement if time permits
  - [ ] Commit fix or document as known issue

- [ ] For MEDIUM and LOW bugs:
  - [ ] Document as known issue or future backlog
  - [ ] Only fix if time available

### Phase 11: Final Verification

**Final Playthroughs with Bug Fixes**:
- [ ] Session 1: Play through waves 1-5 (verify critical fixes)
- [ ] Session 2: Play through waves 5-10 (verify mid-game)
- [ ] Session 3: Play to late waves with boss (verify boss fixes)
- [ ] Verification: No critical bugs remain

**Edge Case Re-verification**:
- [ ] Quick spot-check of previously problematic edge cases
- [ ] Verify fixes don't cause new issues

**Final Documentation**:
- [ ] Update bug-report.md:
  - [ ] List of bugs found
  - [ ] List of bugs fixed
  - [ ] List of known limitations (documented but not fixed)
  - [ ] Recommendation: Release ready if no critical bugs remain

## Completion Criteria

- [ ] 3+ complete game sessions without crashes
- [ ] No critical bugs remaining
- [ ] Edge cases handled gracefully
- [ ] Game experience polished
- [ ] Multiple collision scenarios tested and working
- [ ] Weapon switching tested and working
- [ ] Power-up mechanics tested and working
- [ ] Boss encounter tested and working
- [ ] Screen wrapping tested and working
- [ ] High entity count tested and working
- [ ] All critical bugs documented and fixed
- [ ] Known limitations documented in bug-report.md

## Verification Method

**L1: Functional Gameplay Verification (Manual)**

```
Verification checklist (manual playtesting):
1. Complete 3+ full game sessions without crashes
2. Test each edge case category from Phase 2-8
3. Document any bugs found
4. Fix all critical bugs
5. Verify fixes don't cause regressions
6. Final sign-off: Game is polished and release-ready
```

**Success Indicators**:
- 3 complete sessions played, 0 crashes
- No critical bugs found (or all critical bugs fixed)
- Edge cases handled without glitches
- Game feels polished and stable
- bug-report.md and edge-case-verification.md show completion

## Notes

### Manual Testing Nature
This task is **manual playtesting** - cannot be fully automated. Requires actual human gameplay and observation.

### Testing Approach
- Play naturally: Experience game as user would
- Systematically test edge cases: Deliberate attempts to break things
- Document all anomalies: Record issues for triage
- Fix methodically: Address critical issues first

### Edge Case Priority
- Focus on reproducible, consistent failures
- High-frequency scenarios get priority
- Rare or unreproducible bugs documented but lower priority
- Always prioritize crash/freeze bugs

### Performance Monitoring During Testing
- Watch FPS in Chrome DevTools
- Monitor for memory growth over sessions
- Note any stutters or performance dips
- Report performance regressions to Task 8.1

## Impact Scope

**Testing Areas**: Entire game, all features, all mechanics
**Protected Areas**: Code structure (no refactoring)
**Affected Areas**: Bug fixes only, gameplay polish

## Deliverables

- 3+ complete game sessions verified without crashes
- bug-report.md with all bugs found and fixed
- edge-case-verification.md with edge case test results
- All critical bugs fixed
- Known limitations documented
- Confirmation that game is polished and ready for release
