/**
 * Blockchain Data Fetcher
 * 
 * Fetches on-chain data for Manager Profiles:
 * - Wallet balance (XAND tokens)
 * - NFTs owned
 * - SBTs (Soulbound Tokens)
 * 
 * Uses Solana Web3.js + Metaplex for NFT parsing
 */

// Types for on-chain data
export interface WalletBalance {
  sol: number;
  xand: number; // XAND token balance
  usd: number;  // USD value estimate
}

export interface NFTMetadata {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  collection?: string;
}

export interface SBTMetadata {
  mint: string;
  name: string;
  description: string;
  attributes?: Record<string, string>;
}

export interface OnChainData {
  pubkey: string;
  balance: WalletBalance | null;
  nfts: NFTMetadata[];
  sbts: SBTMetadata[];
  lastFetched: number;
  loading: boolean;
  error?: string;
}

/**
 * Cache for on-chain data (avoid spamming RPC)
 * TTL: 5 minutes
 */
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: OnChainData; timestamp: number }>();

/**
 * Fetch balance for a wallet
 * 
 * @param pubkey - Public key of the wallet
 * @returns Balance in SOL and XAND
 */
export async function fetchWalletBalance(pubkey: string): Promise<WalletBalance | null> {
  try {
    // TODO: Implement with @solana/web3.js
    // const connection = new Connection(SOLANA_RPC_URL);
    // const publicKey = new PublicKey(pubkey);
    // const balance = await connection.getBalance(publicKey);
    
    // Mock data for now
    console.log(`[Blockchain] Fetching balance for ${pubkey.slice(0, 8)}...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      sol: 0,
      xand: 0,
      usd: 0,
    };
  } catch (error) {
    console.error('[Blockchain] Error fetching balance:', error);
    return null;
  }
}

/**
 * Fetch NFTs owned by wallet
 * 
 * Uses Metaplex to get NFT metadata
 * 
 * @param pubkey - Public key of the wallet
 * @returns Array of NFTs
 */
export async function fetchWalletNFTs(pubkey: string): Promise<NFTMetadata[]> {
  try {
    // TODO: Implement with Metaplex
    // const metaplex = new Metaplex(connection);
    // const nfts = await metaplex.nfts().findAllByOwner({ owner: publicKey });
    
    console.log(`[Blockchain] Fetching NFTs for ${pubkey.slice(0, 8)}...`);
    
    // Mock data
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [];
  } catch (error) {
    console.error('[Blockchain] Error fetching NFTs:', error);
    return [];
  }
}

/**
 * Fetch SBTs (Soulbound Tokens) owned by wallet
 * 
 * @param pubkey - Public key of the wallet
 * @returns Array of SBTs
 */
export async function fetchWalletSBTs(pubkey: string): Promise<SBTMetadata[]> {
  try {
    console.log(`[Blockchain] Fetching SBTs for ${pubkey.slice(0, 8)}...`);
    
    // Mock data
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return [];
  } catch (error) {
    console.error('[Blockchain] Error fetching SBTs:', error);
    return [];
  }
}

/**
 * Fetch all on-chain data for a wallet (with caching)
 * 
 * @param pubkey - Public key of the wallet
 * @param forceRefresh - Skip cache and fetch fresh data
 * @returns Complete on-chain data
 */
export async function fetchOnChainData(
  pubkey: string,
  forceRefresh: boolean = false
): Promise<OnChainData> {
  // Check cache first
  if (!forceRefresh) {
    const cached = cache.get(pubkey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Blockchain] Using cached data for ${pubkey.slice(0, 8)}`);
      return cached.data;
    }
  }

  // Fetch fresh data
  console.log(`[Blockchain] Fetching fresh data for ${pubkey.slice(0, 8)}...`);
  
  const data: OnChainData = {
    pubkey,
    balance: null,
    nfts: [],
    sbts: [],
    lastFetched: Date.now(),
    loading: true,
  };

  try {
    // Fetch all data in parallel
    const [balance, nfts, sbts] = await Promise.all([
      fetchWalletBalance(pubkey),
      fetchWalletNFTs(pubkey),
      fetchWalletSBTs(pubkey),
    ]);

    data.balance = balance;
    data.nfts = nfts;
    data.sbts = sbts;
    data.loading = false;

    // Cache the result
    cache.set(pubkey, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    console.error('[Blockchain] Error fetching on-chain data:', error);
    data.loading = false;
    data.error = error instanceof Error ? error.message : 'Unknown error';
    return data;
  }
}

/**
 * Clear cache for a specific pubkey or all cache
 */
export function clearOnChainCache(pubkey?: string) {
  if (pubkey) {
    cache.delete(pubkey);
    console.log(`[Blockchain] Cache cleared for ${pubkey.slice(0, 8)}`);
  } else {
    cache.clear();
    console.log('[Blockchain] All cache cleared');
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()).map(key => ({
      pubkey: key.slice(0, 8) + '...',
      age: Date.now() - (cache.get(key)?.timestamp || 0),
    })),
  };
}
