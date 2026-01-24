# 🐛 Issue: Fix Failing Unit Tests (12 tests)

## Summary

There are **12 unit tests failing** across 3 test files. These failures are **not related to recent PR changes** but should be fixed to maintain code quality and test coverage.

## Test Failures Breakdown

### 1. `tests/kpi.test.ts` - 1 failure

**Test:** `computeVersionOverview > maps nodes into buckets with detail breakdowns and correct health summary`

**Error:**
```
expected undefined to be 1 // Object.is equality
```

**Likely Cause:** The function is not properly calculating or returning the expected health summary structure.

---

### 2. `tests/health.test.ts` - 2 failures

**Test 1:** `getHealthStatus > should return "Private" for a gossip_only node`
```
expected 'Good' to be 'Private' // Object.is equality
```

**Test 2:** `getHealthStatus > should return "Excellent" for optimal conditions`
```
expected 'Good' to be 'Excellent' // Object.is equality
```

**Likely Cause:** The health status logic has changed (possibly consolidated to fewer statuses) but tests haven't been updated to reflect the new behavior. The function may now return "Good" where it previously returned "Private" or "Excellent".

---

### 3. `tests/scoring.test.ts` - 9 failures

#### Scoring Issues (6 failures)

**Test 1:** `calculateNodeScore > Active Nodes > should return a high score for a healthy node on consensus version`
```
expected 77 to be greater than or equal to 85
```

**Test 2:** `calculateNodeScore > Active Nodes > should penalize outdated versions`
```
expected 76 to be less than 76
```

**Test 3:** `calculateNodeScore > Gossip-Only Nodes > should cap gossip nodes at 75 maximum`
```
expected 84 to be less than or equal to 75
```

**Test 4:** `calculateNodeScore > Gossip-Only Nodes > should cap whale gossip nodes at 72`
```
expected 84 to be less than or equal to 72
```

**Test 5:** `calculateNodeScore > Edge Cases > should handle nodes with unknown status`
```
expected 76 to be less than 76
```

**Test 6:** `calculateNodeScore > Edge Cases > should cap max score at 100`
```
expected 101 to be less than or equal to 100
```

**Likely Cause:** Scoring algorithm has been updated (new weights, different caps) but tests still expect the old scoring values.

#### Version Tier Issues (3 failures)

**Test 7:** `Version Tier Calculation > should assign Tier 1 (Consensus) for majority version`
```
expected 3 to be 1 // Object.is equality
```

**Test 8:** `Version Tier Calculation > should assign Tier 2 (Supported) for versions within 2 minor of consensus`
```
expected 3 to be 2 // Object.is equality
```

**Test 9:** `Version Tier Calculation > should assign Tier 3 (Legacy) for older versions`
```
expected 3 to be 3 // Object.is equality (passes but tier name wrong)
```

**Likely Cause:** Version tier calculation logic has changed. The function now returns tier 3 where it should return tier 1 or 2, suggesting the consensus version detection is not working as expected.

---

## Impact

- **65 tests passing** ✅
- **12 tests failing** ❌
- **Test coverage:** ~84% passing

**Blockers:**
- Does not block current PR (no tests related to PR changes)
- Does not block production deployment
- **Should be fixed** to maintain code quality

---

## Proposed Solution

### Phase 1: Health Tests (2 tests)
1. Review current `getHealthStatus` implementation in `lib/health.ts`
2. Determine if tests need updating or if function logic is broken
3. Update tests to match current behavior OR fix function logic

**Estimation:** 5-10 iterations

### Phase 2: Scoring Tests (6 tests)
1. Review `calculateNodeScore` in `lib/scoring.ts`
2. Update test expectations to match new scoring weights
3. Verify caps are correct (gossip nodes, max score)

**Estimation:** 10-15 iterations

### Phase 3: Version Tier Tests (3 tests)
1. Review `calculateVersionTier` logic
2. Debug consensus version detection
3. Fix tier assignment algorithm

**Estimation:** 10-15 iterations

### Phase 4: KPI Test (1 test)
1. Review `computeVersionOverview` in `lib/kpi.ts`
2. Fix health summary calculation

**Estimation:** 5 iterations

**Total Estimation:** 30-45 iterations

---

## Priority

**Medium Priority**

- Tests are important for code quality
- Not blocking current work
- Should be addressed in a dedicated "test fixes" PR
- Can be done in a separate sprint/session

---

## Acceptance Criteria

- [ ] All 12 tests pass
- [ ] No regressions in existing passing tests
- [ ] Test expectations match current implementation behavior
- [ ] Documentation updated if behavior changed intentionally

---

## Labels

- `bug` - Tests are failing
- `tests` - Related to unit tests
- `good-first-issue` - Clear scope, well-documented
- `technical-debt` - Should be fixed but not urgent

---

**Created:** 2026-01-23  
**Related PR:** #[PR_NUMBER] - feat: comprehensive status refactor  
**Status:** Open - Ready for assignment
