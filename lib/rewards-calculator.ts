/**
 * Rewards Calculator
 * Calculates projected earnings based on storage commitment
 */

export interface RewardsCalculation {
  storage: number;              // GB committed
  creditsPerMonth: number;      // Projected earnings
  creditsPerDay: number;
  creditsPerWeek: number;
  creditsPerYear: number;
  networkRank: number;          // Estimated position (1-N)
  percentile: number;           // Top X%
  vsNetworkAvg: number;         // Percentage vs network average (e.g., 130% = 30% above)
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  optimizationTips: string[];
}

export interface CreditsDataPoint {
  pod_id: string;
  credits: number;
}

/**
 * Tier thresholds based on storage commitment (in GB)
 */
const TIER_THRESHOLDS = {
  diamond: 5000,   // 5 TB+
  platinum: 2000,  // 2 TB+
  gold: 1000,      // 1 TB+
  silver: 500,     // 500 GB+
  bronze: 0,       // < 500 GB
} as const;

/**
 * Calculate average credits per GB based on network data
 */
function calculateAvgCreditsPerGB(creditsData: CreditsDataPoint[]): number {
  if (creditsData.length === 0) return 0;
  
  const totalCredits = creditsData.reduce((sum, node) => sum + node.credits, 0);
  const avgCredits = totalCredits / creditsData.length;
  
  // Assume average node commits ~500GB (conservative estimate)
  // This can be refined with actual storage data
  const ASSUMED_AVG_STORAGE_GB = 500;
  
  return avgCredits / ASSUMED_AVG_STORAGE_GB;
}

/**
 * Determine tier based on storage commitment
 */
function getTier(storageGB: number): RewardsCalculation['tier'] {
  if (storageGB >= TIER_THRESHOLDS.diamond) return 'diamond';
  if (storageGB >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (storageGB >= TIER_THRESHOLDS.gold) return 'gold';
  if (storageGB >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

/**
 * Generate optimization tips based on current storage and rank
 */
function generateOptimizationTips(
  storageGB: number,
  networkRank: number,
  totalNodes: number,
  creditsData: CreditsDataPoint[]
): string[] {
  const tips: string[] = [];
  
  // Tier upgrade tips
  if (storageGB < TIER_THRESHOLDS.gold) {
    const gap = TIER_THRESHOLDS.gold - storageGB;
    tips.push(`Add ${Math.ceil(gap)}GB to reach Gold tier and boost visibility`);
  }
  
  // Top 10% tip
  const top10Threshold = Math.ceil(totalNodes * 0.1);
  if (networkRank > top10Threshold && creditsData.length > 0) {
    const top10Node = creditsData[top10Threshold - 1];
    if (top10Node) {
      const gapToTop10 = Math.ceil((top10Node.credits - (storageGB * calculateAvgCreditsPerGB(creditsData))) / calculateAvgCreditsPerGB(creditsData));
      if (gapToTop10 > 0) {
        tips.push(`Increase storage by ~${gapToTop10}GB to reach Top 10%`);
      }
    }
  }
  
  // Network average tip
  const avgCredits = creditsData.reduce((sum, n) => sum + n.credits, 0) / creditsData.length;
  const yourCredits = storageGB * calculateAvgCreditsPerGB(creditsData);
  if (yourCredits < avgCredits) {
    const gapToAvg = Math.ceil((avgCredits - yourCredits) / calculateAvgCreditsPerGB(creditsData));
    tips.push(`Add ${gapToAvg}GB to match network average earnings`);
  }
  
  // High tier encouragement
  if (storageGB >= TIER_THRESHOLDS.platinum) {
    tips.push(`You're in the elite tier! Consider expanding to 10TB for maximum impact`);
  }
  
  return tips.slice(0, 3); // Max 3 tips
}

/**
 * Calculate projected rewards based on storage commitment
 */
export function calculateRewards(
  storageGB: number,
  creditsData: CreditsDataPoint[]
): RewardsCalculation {
  // Handle edge cases
  if (storageGB <= 0 || creditsData.length === 0) {
    return {
      storage: storageGB,
      creditsPerMonth: 0,
      creditsPerDay: 0,
      creditsPerWeek: 0,
      creditsPerYear: 0,
      networkRank: creditsData.length + 1,
      percentile: 100,
      vsNetworkAvg: 0,
      tier: 'bronze',
      optimizationTips: ['Enter a storage amount to see projections'],
    };
  }
  
  // Calculate earnings (linear model: credits proportional to storage)
  const avgCreditsPerGB = calculateAvgCreditsPerGB(creditsData);
  const creditsPerMonth = storageGB * avgCreditsPerGB;
  
  // Sort credits data descending to find rank
  const sortedCredits = [...creditsData].sort((a, b) => b.credits - a.credits);
  
  // Find where user would rank
  let networkRank = 1;
  for (let i = 0; i < sortedCredits.length; i++) {
    if (creditsPerMonth > sortedCredits[i].credits) {
      networkRank = i + 1;
      break;
    }
    networkRank = i + 2; // Would be after this node
  }
  
  // Calculate percentile
  const percentile = (networkRank / creditsData.length) * 100;
  
  // Compare vs network average
  const networkAvgCredits = creditsData.reduce((sum, n) => sum + n.credits, 0) / creditsData.length;
  const vsNetworkAvg = networkAvgCredits > 0 ? (creditsPerMonth / networkAvgCredits) * 100 : 100;
  
  // Determine tier
  const tier = getTier(storageGB);
  
  // Generate tips
  const optimizationTips = generateOptimizationTips(storageGB, networkRank, creditsData.length, creditsData);
  
  return {
    storage: storageGB,
    creditsPerMonth: Math.round(creditsPerMonth),
    creditsPerDay: Math.round(creditsPerMonth / 30),
    creditsPerWeek: Math.round(creditsPerMonth / 4.3),
    creditsPerYear: Math.round(creditsPerMonth * 12),
    networkRank,
    percentile: Math.round(percentile * 10) / 10, // 1 decimal
    vsNetworkAvg: Math.round(vsNetworkAvg),
    tier,
    optimizationTips,
  };
}

/**
 * Format storage value for display
 */
export function formatStorage(gb: number): string {
  if (gb >= 1000) {
    return `${(gb / 1000).toFixed(1)} TB`;
  }
  return `${Math.round(gb)} GB`;
}

/**
 * Get tier color
 */
export function getTierColor(tier: RewardsCalculation['tier']): string {
  const colors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF',
  };
  return colors[tier];
}

/**
 * Preset storage values for quick selection
 */
export const STORAGE_PRESETS = [
  { label: 'Starter', value: 100, tier: 'bronze' as const },
  { label: 'Standard', value: 500, tier: 'silver' as const },
  { label: 'Pro', value: 1000, tier: 'gold' as const },
  { label: 'Elite', value: 2000, tier: 'platinum' as const },
  { label: 'Max', value: 10000, tier: 'diamond' as const },
] as const;
