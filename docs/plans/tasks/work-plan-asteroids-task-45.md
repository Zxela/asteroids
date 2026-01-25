# Task: Code Quality and Coverage

Metadata:
- Phase: 8 (Quality Assurance)
- Task: 8.5
- Dependencies: All previous phases (Phase 1-7 implementations complete)
- Provides: Code quality verification, test coverage report
- Size: Medium (4-5 files - quality checks and coverage)
- Estimated Duration: 1 day

## Implementation Content

Execute comprehensive code quality checks and verify test coverage targets. Run Biome linting and formatting, TypeScript strict mode type checking, circular dependency detection, and test coverage analysis. Achieve 70%+ coverage across statements, branches, functions, and lines. Fix any linting issues, add tests for uncovered critical paths, and document code quality baseline for ongoing maintenance.

*Reference dependencies: Biome configuration, TypeScript configuration, Jest/Vitest coverage tools*

## Target Files

- [x] `src/**/*.ts` - All source files (linting and type checking)
- [x] `tests/**/*.test.ts` - All test files (coverage analysis)
- [x] `docs/coverage-report.md` - Coverage analysis documentation

## Inline Context (REQUIRED - Prevents Re-fetching)

### Code Quality Tools and Targets

From Work Plan Phase 8 Task 8.5:

**Quality Check Commands**:
- `npm run check` - Biome lint + format
- `npm run type-check` - TypeScript strict mode
- `npm run check:deps` - Circular dependency detection
- `npm run test:coverage` - Test coverage report

**Coverage Targets**:
- Statements: 70%+
- Branches: 70%+
- Functions: 70%+
- Lines: 70%+

**All Checks Must Pass**:
- No Biome lint errors
- TypeScript strict mode passes
- No circular dependencies
- Coverage meets targets

### Biome Configuration

Typical linting rules (may vary by project):
- No unused variables
- No console.log in production code (allowed in tests)
- Proper import/export syntax
- No unreachable code
- Proper async/await patterns
- Type consistency

### TypeScript Strict Mode

Strict mode checks:
- `noImplicitAny`: All values must have types
- `noImplicitThis`: All `this` must be typed
- `strictNullChecks`: Cannot use null/undefined without checking
- `strictFunctionTypes`: Function signatures must match exactly
- `alwaysStrict`: Use strict mode

### Test Coverage Definition

**Statement Coverage**: Percentage of statements executed by tests
**Branch Coverage**: Percentage of if/else branches covered
**Function Coverage**: Percentage of functions called by tests
**Line Coverage**: Percentage of lines executed by tests

### Similar Existing Implementations

- `biome.json` or `.biomerc` - Biome configuration
- `tsconfig.json` - TypeScript configuration
- `vitest.config.ts` or Jest configuration - Test setup
- Existing test files showing coverage patterns

### Key Constraints

From Work Plan:
- 70% coverage is minimum acceptable
- Type safety critical (strict mode required)
- Code quality baseline for ongoing maintenance
- Linting consistency prevents technical debt

## Implementation Steps (QA: Quality Verification)

### Phase 1: Setup and Baseline Verification

- [x] Prepare quality check environment:
  - [x] Build project: `npm run build`
  - [x] Verify build succeeds
  - [x] Confirm all tools installed (Biome, TypeScript, test runner)

- [x] Run baseline quality checks:
  - [x] Biome lint: `npm run check`
  - [x] Capture output (any errors detected?) - 0 errors
  - [x] TypeScript check: `npm run type-check`
  - [x] Capture output - passes
  - [x] Dependency check: `npm run check:deps`
  - [x] Capture output - no circular dependencies

- [x] Run baseline test coverage:
  - [x] `npm run test:coverage`
  - [x] Note coverage percentages before improvements
  - [x] Open coverage report: `open coverage/index.html` (or view in browser)
  - [x] Document initial coverage

### Phase 2: Biome Linting and Formatting

**Execute Biome Check**:
- [x] Run: `npm run check`

- [x] If NO ERRORS:
  - [x] Document: "Biome linting - PASS (0 errors)"
  - [x] Proceed to Phase 3

- [ ] If ERRORS FOUND:
  - [ ] Capture error list
  - [ ] Categorize errors:
    - [ ] Unused variables
    - [ ] Formatting issues
    - [ ] Import/export issues
    - [ ] Other

  - [ ] Fix Biome errors:
    - [ ] For each error, correct the issue in source code
    - [ ] Option: Use Biome auto-fix: `npx biome check --write` (if available)
    - [ ] Verify fixes manually or re-run check

  - [ ] Common Biome fixes:
    ```typescript
    // Remove unused variables
    const unused = 5; // DELETE if unused

    // Fix formatting
    const x=5; // Change to: const x = 5;

    // Fix imports
    import {a,b} from "module"; // Change to proper spacing/order

    // Fix unused parameters
    function f(unused: number) {} // Add underscore: (unused: number)
    ```

  - [ ] Re-run: `npm run check`
  - [ ] Repeat until no errors

- [ ] Commit Biome fixes: `git commit -m "style: fix Biome linting issues"`

### Phase 3: TypeScript Type Checking

**Execute Type Check**:
- [x] Run: `npm run type-check`

- [x] If NO ERRORS:
  - [x] Document: "TypeScript strict mode - PASS (0 errors)"
  - [x] Proceed to Phase 4

- [ ] If TYPE ERRORS FOUND:
  - [ ] Capture error list
  - [ ] Categorize by type:
    - [ ] Missing type annotations
    - [ ] Type mismatches
    - [ ] Null/undefined errors
    - [ ] Other

  - [ ] Fix type errors:
    - [ ] For each error, add proper type annotations or fix logic
    - [ ] Add missing type annotations: `const x: number = 5;`
    - [ ] Fix null checks: `if (x !== null) { ... }`
    - [ ] Ensure function returns declared type

  - [ ] Common type fixes:
    ```typescript
    // Add missing annotation
    const x = 5; // Change to: const x: number = 5;

    // Fix null/undefined
    const x = obj.prop; // Change to: const x = obj?.prop ?? defaultValue;

    // Fix function return
    function f(): number { return "x"; } // Change: return 42;

    // Fix type mismatch
    const x: string = 5; // Change: const x: string = "5";
    ```

  - [ ] Re-run: `npm run type-check`
  - [ ] Repeat until no errors

- [ ] Commit type fixes: `git commit -m "fix: resolve TypeScript strict mode errors"`

### Phase 4: Circular Dependency Check

**Execute Dependency Check**:
- [x] Run: `npm run check:deps`

- [x] If NO CIRCULAR DEPENDENCIES:
  - [x] Document: "Circular dependency check - PASS"
  - [x] Proceed to Phase 5

- [ ] If CIRCULAR DEPENDENCIES FOUND:
  - [ ] Capture dependency chains
  - [ ] Analyze circular imports:
    - [ ] Module A imports Module B
    - [ ] Module B imports Module A

  - [ ] Break circular dependency:
    - [ ] Move shared types to separate file
    - [ ] Use dependency injection to break cycle
    - [ ] Reorganize imports
    - [ ] Common solution: Create `types.ts` with shared types

  - [ ] Example fix:
    ```typescript
    // Before (circular):
    // serviceA.ts imports Service B
    // serviceB.ts imports Service A

    // After (fixed):
    // Create: shared.ts with common types
    // serviceA.ts imports shared.ts and Service B
    // serviceB.ts imports shared.ts and Service A
    ```

  - [ ] Re-run: `npm run check:deps`
  - [ ] Repeat until no circular dependencies

- [ ] Commit dependency fixes: `git commit -m "refactor: break circular dependencies"`

### Phase 5: Test Coverage Analysis

**Execute Coverage Report**:
- [x] Run: `npm run test:coverage`

- [x] View coverage report:
  - [x] Open in browser: `coverage/index.html`
  - [x] Review coverage summary:
    - [x] Statements: 94.24%
    - [x] Branches: 87.98%
    - [x] Functions: 91.91%
    - [x] Lines: 94.24%

- [x] Check if all targets met (70%+):
  - [x] Statements ≥ 70%? PASS (94.24%)
  - [x] Branches ≥ 70%? PASS (87.98%)
  - [x] Functions ≥ 70%? PASS (91.91%)
  - [x] Lines ≥ 70%? PASS (94.24%)

- [x] If ALL TARGETS MET:
  - [x] Document: "Coverage achieved: Statements 94.24%, Branches 87.98%, Functions 91.91%, Lines 94.24%"
  - [x] Document coverage baseline
  - [x] Proceed to Phase 6

- [ ] If TARGETS NOT MET:
  - [ ] Identify low-coverage modules:
    - [ ] Click on each file in coverage report
    - [ ] Find lines/branches not covered (shown in red)
    - [ ] Note which functions have low coverage

  - [ ] Strategy for improving coverage:
    - [ ] Add unit tests for uncovered critical functions
    - [ ] Focus on critical paths (game logic, systems)
    - [ ] Skip coverage for trivial functions (getters, setters)
    - [ ] Add edge case tests for error paths

  - [ ] Add tests for uncovered critical paths:
    - [ ] Create test cases for missing coverage
    - [ ] Run specific test: `npm test -- [file].test.ts`
    - [ ] Verify new tests pass
    - [ ] Re-run coverage: `npm run test:coverage`

  - [ ] Iterate until targets met

- [ ] Commit coverage improvements: `git commit -m "test: improve test coverage to 70%+"`

### Phase 6: Final Quality Verification

**Complete Quality Check Run**:
- [x] Run all quality checks in sequence:
  ```bash
  npm run check           # Biome lint + format
  npm run type-check      # TypeScript strict mode
  npm run check:deps      # Circular dependencies
  npm run test:coverage   # Coverage report
  ```

- [x] Verify all checks pass:
  - [x] Biome: No errors (0 errors in 90 files)
  - [x] TypeScript: No errors
  - [x] Dependencies: No circular dependencies
  - [x] Coverage: All targets >=70% (94.24%/87.98%/91.91%/94.24%)

- [x] If all pass:
  - [x] Document completion date: 2026-01-23
  - [x] Record final metrics
  - [x] Proceed to Phase 7

- [ ] If any check fails:
  - [ ] Return to appropriate phase (2, 3, 4, or 5)
  - [ ] Fix remaining issues
  - [ ] Re-run complete quality check

### Phase 7: Documentation and Baseline Recording

- [x] Create coverage-report.md:
  - [x] Quality check date/time: 2026-01-23
  - [x] Final coverage metrics:
    ```markdown
    | Metric | Coverage | Target | Status |
    |--------|----------|--------|--------|
    | Statements | 94.24% | 70% | PASS |
    | Branches | 87.98% | 70% | PASS |
    | Functions | 91.91% | 70% | PASS |
    | Lines | 94.24% | 70% | PASS |
    ```
  - [x] Linting status: No errors (0 errors in 90 files)
  - [x] Type checking status: No errors
  - [x] Circular dependencies: None
  - [x] Coverage report location: `coverage/index.html`
  - [x] Recommendations for maintenance

- [x] Record baseline for regression detection:
  - [x] Coverage baseline: 94.24% statements (for future comparison)
  - [x] Quality checks automated: CI/CD should run on each commit
  - [x] Recommendation: Fail build if coverage drops below 70%

## Completion Criteria

- [x] No Biome lint errors (0 errors in 90 files)
- [x] TypeScript strict mode passes (no type errors)
- [x] No circular dependencies
- [x] Coverage: 70%+ statements (94.24%)
- [x] Coverage: 70%+ branches (87.98%)
- [x] Coverage: 70%+ functions (91.91%)
- [x] Coverage: 70%+ lines (94.24%)
- [x] coverage-report.md created with complete analysis
- [x] Code quality baseline established
- [x] All quality checks passing together

## Verification Method

**L2: Quality Test Verification**

```bash
# Run complete quality check suite
npm run check:all        # Runs all quality checks

# Or individually:
npm run check           # Biome lint
npm run type-check      # TypeScript
npm run check:deps      # Dependencies
npm run test:coverage   # Coverage

# Expected: All pass with 0 errors/warnings
# Coverage: 70%+ on all metrics
```

**Success Indicators**:
- All quality commands pass without errors
- Coverage report shows 70%+ on all metrics
- No files with uncovered critical paths
- Code quality baseline recorded
- No regressions from previous baseline

## Notes

### Coverage Measurement
- Coverage includes unit tests only (E2E tests may not be counted)
- Untestable code (getters, simple assignments) may be excluded
- Focus coverage on critical paths (business logic, systems)
- Utility functions may have lower priority

### Maintaining Coverage
- Recommend: Add coverage check to CI/CD
- Fail build if coverage drops below 70%
- Add tests for new features (before code coverage drops)
- Regularly review coverage report

### Common Linting Issues
- Unused variables: Remove or use `_unused` prefix
- Formatting: Run Biome auto-fix
- Unused imports: Remove unused imports
- Console.log: Remove from production code (keep in tests)

### Type Safety Best Practices
- Always use explicit types (avoid `any`)
- Use `readonly` for immutable data
- Use `const` instead of `let` where possible
- Verify null/undefined before using values

## Impact Scope

**Quality Areas**:
- Code consistency and standards
- Type safety and error prevention
- Coverage of critical paths
- Maintainability and technical debt

**Protected Areas**:
- Game logic and mechanics (no functional changes)
- Performance (no regressions)
- User-facing behavior

**Affected Areas**:
- Code style and formatting
- Type annotations
- Test coverage
- Code quality metrics

## Deliverables

- Code quality verification (all checks passing)
- Test coverage report (70%+ achieved)
- coverage-report.md with complete analysis
- Code quality baseline for ongoing maintenance
- Recommendation for CI/CD integration
