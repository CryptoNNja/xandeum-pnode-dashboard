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

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';

// Solana RPC endpoint from environment
// Default to a more reliable public RPC (Project Serum/OpenBook)
const PRIMARY_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://solana-api.projectserum.com';

// Fallback RPCs in case primary fails
const FALLBACK_RPCS = [
  'https://solana-api.projectserum.com',
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
];

// Xandeum Token Mint Addresses
const XAND_TOKEN_MINT = 'XANDuUoVoUqniKkpcKhrxmvYJybpJvUxJLr21Gaj3Hx';
const XENO_TOKEN_MINT = 'G2bTxNndhA9zxxy4PZnHFcQo9wQQozrfcmN6AN9Heqoe';

// Keywords to identify Xandeum-related NFTs/SBTs
const XANDEUM_KEYWORDS = [
  'xandeum',
  'xand',
  'pnode',
  'manager',
  'xandash',
  'sbt',
  'deepsouth',
  'dragon',
  'rabbit',
  'deep south',
  'g2btxn'
];

// Helper to get a working RPC connection
async function getConnection(): Promise<Connection> {
  // Try primary RPC first
  try {
    const connection = new Connection(PRIMARY_RPC_URL, 'confirmed');
    // Quick health check
    await connection.getVersion();
    return connection;
  } catch (error) {
    console.warn(`[Blockchain] Primary RPC failed: ${PRIMARY_RPC_URL}`, error);
  }
  
  // Try fallback RPCs
  for (const rpcUrl of FALLBACK_RPCS) {
    if (rpcUrl === PRIMARY_RPC_URL) continue; // Skip if already tried
    
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      await connection.getVersion();
      console.log(`[Blockchain] Using fallback RPC: ${rpcUrl}`);
      return connection;
    } catch (error) {
      console.warn(`[Blockchain] Fallback RPC failed: ${rpcUrl}`, error);
    }
  }
  
  // If all fail, return primary anyway (will error later with more context)
  console.error('[Blockchain] All RPC endpoints failed, using primary as last resort');
  return new Connection(PRIMARY_RPC_URL, 'confirmed');
}

// Types for on-chain data
export interface WalletBalance {
  sol: number;
  xand: number; // XAND token balance
  xeno: number; // XENO token balance
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
    console.log(`[Blockchain] Fetching balance for ${pubkey.slice(0, 8)}...`);
    
    const connection = await getConnection();
    const publicKey = new PublicKey(pubkey);
    
    // Fetch SOL balance
    const lamports = await connection.getBalance(publicKey);
    const sol = lamports / LAMPORTS_PER_SOL;
    
    // Fetch XAND token balance
    let xand = 0;
    try {
      const xandMint = new PublicKey(XAND_TOKEN_MINT);
      const xandAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: xandMint }
      );
      xand = xandAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
      console.log(`[Blockchain] XAND balance for ${pubkey.slice(0, 8)}: ${xand}`);
    } catch (error: any) {
      console.warn(`[Blockchain] Error fetching XAND balance for ${pubkey.slice(0, 8)}:`, error?.message || error);
    }
    
    // Fetch XENO token balance
    let xeno = 0;
    try {
      const xenoMint = new PublicKey(XENO_TOKEN_MINT);
      const xenoAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: xenoMint }
      );
      xeno = xenoAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
      console.log(`[Blockchain] XENO balance for ${pubkey.slice(0, 8)}: ${xeno}`);
    } catch (error: any) {
      console.warn(`[Blockchain] Error fetching XENO balance for ${pubkey.slice(0, 8)}:`, error?.message || error);
    }
    
    // Get SOL price (simplified - you can use a price API later)
    const solPriceUSD = 200; // Approximate, TODO: fetch from CoinGecko API
    
    return {
      sol,
      xand,
      xeno,
      usd: sol * solPriceUSD,
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
    console.log(`[Blockchain] Fetching NFTs for ${pubkey.slice(0, 8)}...`);
    
    // Use Helius DAS API instead of Metaplex (much faster and more reliable)
    const response = await fetch(`${PRIMARY_RPC_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'nft-fetch',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: pubkey,
          page: 1,
          limit: 100,
          displayOptions: {
            showFungible: false,
            showNativeBalance: false,
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }
    
    const assets = data.result?.items || [];
    
    console.log(`[Blockchain] Found ${assets.length} NFTs for ${pubkey.slice(0, 8)}`);
    
    if (assets.length === 0) {
      return [];
    }
    
    // Convert to our NFTMetadata format
    const results: NFTMetadata[] = assets
      .filter((asset: any) => asset.interface === 'V1_NFT') // Only NFTs, not tokens
      .slice(0, 20) // Limit to 20 for UI
      .map((asset: any) => {
        const metadata = asset.content?.metadata || {};
        const name = metadata.name || 'Unknown';
        const symbol = metadata.symbol || '';
        
        // Check if Xandeum-related
        const isXandeum = XANDEUM_KEYWORDS.some(keyword =>
          name.toLowerCase().includes(keyword) || 
          symbol.toLowerCase().includes(keyword) ||
          (metadata.description || '').toLowerCase().includes(keyword)
        );
        
        if (isXandeum) {
          console.log(`[Blockchain] Found Xandeum NFT: ${name}`);
        }
        
        return {
          mint: asset.id,
          name,
          symbol,
          image: asset.content?.files?.[0]?.uri || asset.content?.links?.image || null,
          collection: asset.grouping?.find((g: any) => g.group_key === 'collection')?.group_value,
        };
      });
    
    return results;
  } catch (error: any) {
    // Handle rate limiting gracefully
    if (error.message?.includes('429') || error.message?.includes('Too many requests')) {
      console.warn('[Blockchain] Rate limit reached while fetching NFTs');
      return [];
    }
    console.error('[Blockchain] Error fetching NFTs:', error);
    return [];
  }
}

/**
 * Fetch SBTs (Soulbound Tokens) owned by wallet
 * 
 * SBTs are NFTs that are non-transferable (soulbound)
 * We identify them by checking if they're from known SBT programs
 * or have specific metadata attributes
 * 
 * @param pubkey - Public key of the wallet
 * @returns Array of SBTs
 */
export async function fetchWalletSBTs(pubkey: string): Promise<SBTMetadata[]> {
  try {
    console.log(`[Blockchain] Fetching SBTs for ${pubkey.slice(0, 8)}...`);
    
    // Use Helius DAS API - same as NFTs but filter for SBTs
    const response = await fetch(`${PRIMARY_RPC_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'sbt-fetch',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: pubkey,
          page: 1,
          limit: 100,
          displayOptions: {
            showFungible: false,
            showNativeBalance: false,
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }
    
    const assets = data.result?.items || [];
    
    console.log(`[Blockchain] Checking ${assets.length} assets for SBTs`);
    
    if (assets.length === 0) {
      return [];
    }
    
    // Filter for SBTs
    const results: SBTMetadata[] = assets
      .filter((asset: any) => {
        if (asset.interface !== 'V1_NFT') return false;
        
        const metadata = asset.content?.metadata || {};
        const name = (metadata.name || '').toLowerCase();
        const symbol = (metadata.symbol || '').toLowerCase();
        const description = (metadata.description || '').toLowerCase();
        
        // Check if Xandeum-related
        const isXandeum = XANDEUM_KEYWORDS.some(keyword =>
          name.includes(keyword) || symbol.includes(keyword) || description.includes(keyword)
        );
        
        if (!isXandeum) return false;
        
        // Check if it's an SBT
        const isSBT = 
          !asset.mutable || // Non-mutable
          name.includes('sbt') ||
          name.includes('badge') ||
          name.includes('achievement') ||
          symbol.includes('sbt');
        
        return isSBT;
      })
      .slice(0, 20)
      .map((asset: any) => {
        const metadata = asset.content?.metadata || {};
        
        return {
          mint: asset.id,
          name: metadata.name || 'Unknown',
          description: metadata.description || '',
          attributes: metadata.attributes?.reduce((acc: Record<string, string>, attr: any) => {
            if (attr.trait_type && attr.value) {
              acc[attr.trait_type] = String(attr.value);
            }
            return acc;
          }, {} as Record<string, string>) || {},
        };
      });
    
    console.log(`[Blockchain] Found ${results.length} SBTs for ${pubkey.slice(0, 8)}`);
    
    return results;
  } catch (error: any) {
    // Handle rate limiting gracefully
    if (error.message?.includes('429') || error.message?.includes('Too many requests')) {
      console.warn('[Blockchain] Rate limit reached while fetching SBTs');
      return [];
    }
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
