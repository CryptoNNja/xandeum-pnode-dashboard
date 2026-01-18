import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { calculateRewards, type RewardsCalculation, type CreditsDataPoint } from '@/lib/rewards-calculator';

export function useRewardsCalculator(creditsData: CreditsDataPoint[]) {
  const [storageGB, setStorageGB] = useState(500); // Default 500GB
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Debounce storage input to avoid excessive recalculations during slider drag
  const [debouncedStorage] = useDebounce(storageGB, 300);
  
  // Calculate rewards based on debounced storage
  const calculation = useMemo<RewardsCalculation>(() => {
    return calculateRewards(debouncedStorage, creditsData);
  }, [debouncedStorage, creditsData]);
  
  // Simulate calculation delay for smooth UX (optional)
  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => setIsCalculating(false), 200);
    return () => clearTimeout(timer);
  }, [debouncedStorage]);
  
  return {
    storageGB,
    setStorageGB,
    calculation,
    isCalculating,
  };
}
