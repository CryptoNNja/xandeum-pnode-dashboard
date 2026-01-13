/**
 * Official Xandeum APIs Integration
 * 
 * Fetches and processes data from official MAINNET and DEVNET registries
 */

export interface PodCredit {
  pod_id: string;
  credits: number;
}

export interface OfficialRegistryData {
  mainnetPubkeys: Set<string>;
  devnetPubkeys: Set<string>;
  mainnetCredits: Map<string, number>;
  devnetCredits: Map<string, number>;
  mainnetCount: number;
  devnetCount: number;
}

export interface SyncResult {
  mainnetRegistry: PodCredit[];
  devnetRegistry: PodCredit[];
  mainnetPubkeys: Set<string>;
  devnetPubkeys: Set<string>;
  missingMainnet: string[];
  missingDevnet: string[];
  wrongNetwork: Array<{ pubkey: string; currentNetwork: string; officialNetwork: string }>;
  zombies: string[];
}

const MAINNET_API_URL = 'https://podcredits.xandeum.network/api/mainnet-pod-credits';
const DEVNET_API_URL = 'https://podcredits.xandeum.network/api/pods-credits';

/**
 * Fetch official registry data from APIs
 */
export async function fetchOfficialRegistries(): Promise<OfficialRegistryData> {
  console.log('📡 Fetching Official Registries...');

  // Fetch MAINNET registry
  const mainnetResponse = await fetch(MAINNET_API_URL, { 
    signal: AbortSignal.timeout(10000) 
  });
  const mainnetData = await mainnetResponse.json();
  const mainnetRegistry: PodCredit[] = mainnetData.pods_credits || [];

  console.log(`   ✅ MAINNET API: ${mainnetRegistry.length} nodes`);

  // Fetch DEVNET registry
  const devnetResponse = await fetch(DEVNET_API_URL, { 
    signal: AbortSignal.timeout(10000) 
  });
  const devnetData = await devnetResponse.json();
  const devnetRegistry: PodCredit[] = devnetData.pods_credits || [];

  console.log(`   ✅ DEVNET API: ${devnetRegistry.length} nodes`);

  // Create lookup sets and maps
  const mainnetPubkeys = new Set(mainnetRegistry.map(p => p.pod_id));
  const devnetPubkeys = new Set(devnetRegistry.map(p => p.pod_id));
  
  const mainnetCredits = new Map(mainnetRegistry.map(p => [p.pod_id, p.credits]));
  const devnetCredits = new Map(devnetRegistry.map(p => [p.pod_id, p.credits]));

  return {
    mainnetPubkeys,
    devnetPubkeys,
    mainnetCredits,
    devnetCredits,
    mainnetCount: mainnetRegistry.length,
    devnetCount: devnetRegistry.length
  };
}

/**
 * Sync with official APIs and detect issues
 */
export async function syncWithOfficialAPIs(
  currentNodes: Array<{ pubkey: string | null; network: string; ip: string }>
): Promise<SyncResult> {
  
  const registries = await fetchOfficialRegistries();
  
  // Build map of our current nodes
  const ourPubkeysMap = new Map(
    currentNodes
      .filter(n => n.pubkey)
      .map(n => [n.pubkey!, n])
  );

  // Find missing nodes (in official API but not in our DB)
  const missingMainnet = Array.from(registries.mainnetPubkeys)
    .filter(pk => !ourPubkeysMap.has(pk));

  const missingDevnet = Array.from(registries.devnetPubkeys)
    .filter(pk => !ourPubkeysMap.has(pk));

  // Find nodes with wrong network classification
  const wrongNetwork = currentNodes
    .filter(n => n.pubkey)
    .filter(n => {
      const pk = n.pubkey!;
      const inMainnet = registries.mainnetPubkeys.has(pk);
      const inDevnet = registries.devnetPubkeys.has(pk);
      
      // If in MAINNET API but classified as DEVNET (or vice versa)
      if (inMainnet && n.network !== 'MAINNET') {
        return true;
      }
      if (inDevnet && n.network !== 'DEVNET') {
        return true;
      }
      return false;
    })
    .map(n => ({
      pubkey: n.pubkey!,
      currentNetwork: n.network,
      officialNetwork: registries.mainnetPubkeys.has(n.pubkey!) ? 'MAINNET' : 'DEVNET'
    }));

  // Find zombie nodes (in our DB but NOT in any official API)
  const zombies = currentNodes
    .filter(n => n.pubkey)
    .filter(n => {
      const pk = n.pubkey!;
      return !registries.mainnetPubkeys.has(pk) && !registries.devnetPubkeys.has(pk);
    })
    .map(n => n.pubkey!);

  // Convert back to arrays for return
  const mainnetRegistry: PodCredit[] = Array.from(registries.mainnetPubkeys).map(pk => ({
    pod_id: pk,
    credits: registries.mainnetCredits.get(pk) || 0
  }));

  const devnetRegistry: PodCredit[] = Array.from(registries.devnetPubkeys).map(pk => ({
    pod_id: pk,
    credits: registries.devnetCredits.get(pk) || 0
  }));

  console.log('\n📊 Sync Analysis:');
  console.log(`   Missing MAINNET: ${missingMainnet.length}`);
  console.log(`   Missing DEVNET: ${missingDevnet.length}`);
  console.log(`   Wrong Network: ${wrongNetwork.length}`);
  console.log(`   Zombies: ${zombies.length}`);

  return {
    mainnetRegistry,
    devnetRegistry,
    mainnetPubkeys: registries.mainnetPubkeys,
    devnetPubkeys: registries.devnetPubkeys,
    missingMainnet,
    missingDevnet,
    wrongNetwork,
    zombies
  };
}

/**
 * Get credits for a pubkey from official registries
 */
export function getCreditsForPubkey(
  pubkey: string,
  mainnetRegistry: PodCredit[],
  devnetRegistry: PodCredit[]
): number {
  const mainnetNode = mainnetRegistry.find(p => p.pod_id === pubkey);
  if (mainnetNode) return mainnetNode.credits;

  const devnetNode = devnetRegistry.find(p => p.pod_id === pubkey);
  if (devnetNode) return devnetNode.credits;

  return 0;
}
