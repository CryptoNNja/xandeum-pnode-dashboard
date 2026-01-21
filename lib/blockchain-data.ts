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
    
    // TODO: Fetch XAND token balance
    // For now, we'll leave XAND at 0 until we have the XAND token mint address
    // const xandMint = new PublicKey('XAND_TOKEN_MINT_ADDRESS_HERE');
    // const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    //   publicKey,
    //   { mint: xandMint }
    // );
    // const xand = tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
    
    // Get SOL price (simplified - you can use a price API later)
    const solPriceUSD = 200; // Approximate, TODO: fetch from CoinGecko API
    
    return {
      sol,
      xand: 0, // TODO: Implement when we have XAND mint address
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
    
    const connection = await getConnection();
    const metaplex = Metaplex.make(connection);
    const publicKey = new PublicKey(pubkey);
    
    // Find all NFTs owned by this wallet
    const nfts = await metaplex.nfts().findAllByOwner({ owner: publicKey });
    
    console.log(`[Blockchain] Found ${nfts.length} NFTs for ${pubkey.slice(0, 8)}`);
    
    // If no NFTs, return early
    if (nfts.length === 0) {
      return [];
    }
    
    // Load full metadata for each NFT (limit to first 10 to reduce RPC calls)
    const results: NFTMetadata[] = [];
    const limit = Math.min(nfts.length, 10);
    
    for (let i = 0; i < limit; i++) {
      const nft = nfts[i];
      try {
        // Check if nft already has metadata loaded
        const fullNft = 'json' in nft ? nft : await metaplex.nfts().load({ metadata: nft as any });
        results.push({
          mint: nft.address.toBase58(),
          name: fullNft.name,
          symbol: fullNft.symbol,
          image: fullNft.json?.image,
          collection: fullNft.collection?.address.toBase58(),
        });
        
        // Add delay between requests to avoid rate limiting (50ms)
        if (i < limit - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error: any) {
        // Check if it's a rate limit error
        if (error.message?.includes('429') || error.message?.includes('Too many requests')) {
          console.warn(`[Blockchain] Rate limit hit, stopping NFT fetch at ${i}/${limit}`);
          break; // Stop trying to avoid further rate limits
        }
        console.error(`[Blockchain] Error loading NFT ${nft.address.toBase58()}:`, error);
        // Skip failed NFT and continue
      }
    }
    
    return results;
  } catch (error: any) {
    // Handle rate limiting gracefully
    if (error.message?.includes('429') || error.message?.includes('Too many requests')) {
      console.warn('[Blockchain] Rate limit reached while fetching NFTs');
      return []; // Return empty array instead of throwing
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
    
    const connection = await getConnection();
    const metaplex = Metaplex.make(connection);
    const publicKey = new PublicKey(pubkey);
    
    // Find all NFTs first
    const nfts = await metaplex.nfts().findAllByOwner({ owner: publicKey });
    
    console.log(`[Blockchain] Checking ${nfts.length} NFTs for SBTs`);
    
    // If no NFTs, return early
    if (nfts.length === 0) {
      return [];
    }
    
    // Filter for SBTs (non-transferable NFTs)
    // Note: This is a simplified check. Limit to first 10 to reduce RPC calls
    const results: SBTMetadata[] = [];
    const limit = Math.min(nfts.length, 10);
    
    for (let i = 0; i < limit; i++) {
      const nft = nfts[i];
      try {
        // Check if nft already has metadata loaded
        const fullNft = 'json' in nft ? nft : await metaplex.nfts().load({ metadata: nft as any });
        
        // Check if it's an SBT (various methods to detect)
        const isSBT = 
          !fullNft.isMutable || // Non-mutable NFTs are often SBTs
          fullNft.json?.attributes?.some((attr: any) => 
            attr.trait_type?.toLowerCase() === 'soulbound' && attr.value === 'true'
          ) ||
          fullNft.name.toLowerCase().includes('sbt') ||
          fullNft.name.toLowerCase().includes('badge') ||
          fullNft.name.toLowerCase().includes('achievement');
        
        if (isSBT) {
          results.push({
            mint: nft.address.toBase58(),
            name: fullNft.name,
            description: fullNft.json?.description || '',
            attributes: fullNft.json?.attributes?.reduce((acc: Record<string, string>, attr: any) => {
              if (attr.trait_type && attr.value) {
                acc[attr.trait_type] = attr.value;
              }
              return acc;
            }, {} as Record<string, string>),
          });
        }
        
        // Add delay between requests to avoid rate limiting (50ms)
        if (i < limit - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error: any) {
        // Check if it's a rate limit error
        if (error.message?.includes('429') || error.message?.includes('Too many requests')) {
          console.warn(`[Blockchain] Rate limit hit, stopping SBT check at ${i}/${limit}`);
          break; // Stop trying to avoid further rate limits
        }
        console.error(`[Blockchain] Error loading potential SBT ${nft.address.toBase58()}:`, error);
        // Skip failed SBT and continue
      }
    }
    
    return results;
  } catch (error: any) {
    // Handle rate limiting gracefully
    if (error.message?.includes('429') || error.message?.includes('Too many requests')) {
      console.warn('[Blockchain] Rate limit reached while fetching SBTs');
      return []; // Return empty array instead of throwing
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
