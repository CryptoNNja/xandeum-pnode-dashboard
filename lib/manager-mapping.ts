/**
 * Manager Mapping
 * 
 * Provides the mapping between node pubkeys and manager wallet addresses
 * Fetches data from /api/manager-mapping endpoint
 */

// Simple in-memory cache
let cachedMapping: Record<string, string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function loadMapping(): Promise<Record<string, string>> {
  // Check cache
  if (cachedMapping && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedMapping;
  }
  
  try {
    const response = await fetch('/api/manager-mapping');
    const data = await response.json();
    
    if (data.success) {
      cachedMapping = data.mapping;
      cacheTimestamp = Date.now();
      console.log(`[ManagerMapping] Loaded ${Object.keys(cachedMapping).length} mappings`);
      return cachedMapping;
    }
  } catch (error: any) {
    console.error('[ManagerMapping] Failed to load mapping:', error?.message || error);
  }
  
  return {};
}

/**
 * Get the manager wallet address for a given node pubkey
 * 
 * @param nodePubkey - The pNode pubkey
 * @returns Manager wallet address, or null if not found
 */
export async function getManagerWallet(nodePubkey: string): Promise<string | null> {
  const mapping = await loadMapping();
  return mapping[nodePubkey] || null;
}
