/**
 * Manager Wallet Discovery
 * 
 * Discovers the manager wallet for a pNode by:
 * 1. Checking on-chain program data (Devnet registrar, Mainnet buyer)
 * 2. Scanning transaction history to find who registered the node
 * 
 * Discovers manager wallets from on-chain transaction history
 */

import { Connection, PublicKey } from '@solana/web3.js';

// Xandeum Program IDs
const DEVNET_PROGRAM = new PublicKey('6Bzz3KPvzQruqBg2vtsvkuitd6Qb4iCcr5DViifCwLsL');
const MAINNET_PROGRAM = new PublicKey('CZ9bXL6D4uiLXGsSk5s8KAgTFEVp3gdpxPxTCrgm3VoL');

// RPC endpoints
const DEVNET_RPC = 'https://api.devnet.xandeum.com:8899';
const MAINNET_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// Cache connections
let devnetConn: Connection | null = null;
let mainnetConn: Connection | null = null;

function getDevnetConnection(): Connection {
  if (!devnetConn) {
    devnetConn = new Connection(DEVNET_RPC, 'confirmed');
  }
  return devnetConn;
}

function getMainnetConnection(): Connection {
  if (!mainnetConn) {
    mainnetConn = new Connection(MAINNET_RPC, 'confirmed');
  }
  return mainnetConn;
}

/**
 * Discover the manager wallet for a given node pubkey
 * 
 * Strategy:
 * 1. Try to find registrar wallet on Devnet (who registered the node)
 * 2. Try to find buyer wallet on Mainnet (who purchased the node)
 * 3. Return the first one found
 */
export async function discoverManagerWallet(nodePubkey: string): Promise<string | null> {
  try {
    console.log(`[ManagerDiscovery] Discovering manager wallet for ${nodePubkey.slice(0, 8)}...`);
    
    // Try Devnet registrar first (most likely to exist)
    const registrar = await findDevnetRegistrar(nodePubkey);
    if (registrar) {
      console.log(`[ManagerDiscovery] Found Devnet registrar: ${registrar.slice(0, 8)}...`);
      return registrar;
    }
    
    // Try Mainnet buyer
    const buyer = await findMainnetBuyer(nodePubkey);
    if (buyer) {
      console.log(`[ManagerDiscovery] Found Mainnet buyer: ${buyer.slice(0, 8)}...`);
      return buyer;
    }
    
    console.warn(`[ManagerDiscovery] No manager wallet found for ${nodePubkey.slice(0, 8)}`);
    return null;
  } catch (error) {
    console.error(`[ManagerDiscovery] Error discovering wallet for ${nodePubkey}:`, error);
    return null;
  }
}

/**
 * Find the Devnet registrar wallet for a node
 * Looks at transaction history to find who called the registration instruction
 */
async function findDevnetRegistrar(nodePubkey: string): Promise<string | null> {
  try {
    const connection = getDevnetConnection();
    const publicKey = new PublicKey(nodePubkey);
    
    // Get recent transaction signatures for this node
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 50 });
    
    if (signatures.length === 0) {
      return null;
    }
    
    // Look through transactions to find registration
    for (const sigInfo of signatures) {
      try {
        const tx = await connection.getParsedTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (!tx || !tx.transaction) continue;
        
        // Check if this transaction involves the Devnet program
        const accountKeys = tx.transaction.message.accountKeys;
        const programInvolved = accountKeys.some(
          key => key.pubkey.toString() === DEVNET_PROGRAM.toString()
        );
        
        if (programInvolved) {
          // The fee payer is likely the registrar
          const feePayer = accountKeys[0]?.pubkey.toString();
          if (feePayer && feePayer !== nodePubkey) {
            return feePayer;
          }
        }
      } catch (error) {
        // Skip failed transactions
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[ManagerDiscovery] Error finding Devnet registrar:', error);
    return null;
  }
}

/**
 * Find the Mainnet buyer wallet for a node
 * Similar approach but on Mainnet
 */
async function findMainnetBuyer(nodePubkey: string): Promise<string | null> {
  try {
    const connection = getMainnetConnection();
    const publicKey = new PublicKey(nodePubkey);
    
    // Get recent transaction signatures
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 50 });
    
    if (signatures.length === 0) {
      return null;
    }
    
    // Look through transactions
    for (const sigInfo of signatures) {
      try {
        const tx = await connection.getParsedTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (!tx || !tx.transaction) continue;
        
        // Check if this transaction involves the Mainnet program
        const accountKeys = tx.transaction.message.accountKeys;
        const programInvolved = accountKeys.some(
          key => key.pubkey.toString() === MAINNET_PROGRAM.toString()
        );
        
        if (programInvolved) {
          // The fee payer is likely the buyer
          const feePayer = accountKeys[0]?.pubkey.toString();
          if (feePayer && feePayer !== nodePubkey) {
            return feePayer;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[ManagerDiscovery] Error finding Mainnet buyer:', error);
    return null;
  }
}

/**
 * Batch discover manager wallets for multiple nodes
 * More efficient than calling discoverManagerWallet individually
 */
export async function discoverManagerWalletsBatch(
  nodePubkeys: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  console.log(`[ManagerDiscovery] Starting batch discovery for ${nodePubkeys.length} nodes`);
  
  for (let i = 0; i < nodePubkeys.length; i++) {
    const pubkey = nodePubkeys[i];
    
    if (onProgress) {
      onProgress(i + 1, nodePubkeys.length);
    }
    
    const managerWallet = await discoverManagerWallet(pubkey);
    
    if (managerWallet) {
      results.set(pubkey, managerWallet);
    }
    
    // Add small delay to avoid rate limits
    if (i < nodePubkeys.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`[ManagerDiscovery] Batch complete: Found ${results.size}/${nodePubkeys.length} manager wallets`);
  
  return results;
}
