'use client';

/**
 * Normalize the base offset used for floating button positioning.
 * - Ensures the offset is finite and non-negative so layout is predictable.
 * - For valid, non-negative inputs, this behaves as a no-op.
 * - Foundation for Phase 2: will handle footer avoidance and dynamic positioning
 */
export function useFloatingButtonPosition(baseOffset: number): number {
  if (!Number.isFinite(baseOffset) || baseOffset < 0) {
    return 0;
  }
  return baseOffset;
}
