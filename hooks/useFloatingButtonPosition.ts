'use client';

/**
 * Simply returns the base offset - no footer avoidance
 * Best approach: let buttons scroll naturally with page
 * Footer has enough padding/margin to not overlap anyway
 */
export function useFloatingButtonPosition(baseOffset: number) {
  return baseOffset;
}
