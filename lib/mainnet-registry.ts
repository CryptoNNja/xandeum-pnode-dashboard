/**
 * 🎯 MAINNET Registry - Source Officielle
 * 
 * Utilise l'API officielle Xandeum pour identifier les nodes MAINNET
 * Source: https://podcredits.xandeum.network/api/mainnet-pod-credits
 * 
 * Cette API est LA source de vérité maintenue par l'équipe Xandeum.
 * Tous les pod_id dans cette API sont des nodes MAINNET qui gagnent des crédits.
 */

export interface MainnetPodCredit {
  pod_id: string;
  credits?: number;
  [key: string]: any;
}

export class MainnetRegistry {
  private mainnetPodIds: Set<string> = new Set();
  private lastUpdated: Date | null = null;
  private readonly CACHE_TTL = 3600000; // 1h
  private cacheExpiry: Date | null = null;

  /**
   * Récupère la liste officielle des nodes MAINNET
   */
  async refreshMainnetList(): Promise<void> {
    try {
      console.log('🔄 Fetching official MAINNET list from Xandeum...');
      
      const response = await fetch('https://podcredits.xandeum.network/api/mainnet-pod-credits', {
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: any = await response.json();
      
      // L'API retourne { status: "success", pods_credits: [...] }
      if (!data.pods_credits || !Array.isArray(data.pods_credits)) {
        throw new Error('Invalid API response: expected pods_credits array');
      }

      // Extraire tous les pod_id MAINNET
      this.mainnetPodIds.clear();
      data.pods_credits.forEach((pod: MainnetPodCredit) => {
        if (pod.pod_id) {
          this.mainnetPodIds.add(pod.pod_id);
        }
      });

      this.lastUpdated = new Date();
      this.cacheExpiry = new Date(Date.now() + this.CACHE_TTL);
      
      console.log(`✅ MAINNET registry updated: ${this.mainnetPodIds.size} official nodes`);
      
    } catch (err: any) {
      console.error('❌ Failed to fetch MAINNET list:', err.message);
      throw err;
    }
  }

  /**
   * Vérifie si un pubkey est MAINNET
   */
  isMainnet(pubkey: string): boolean {
    return this.mainnetPodIds.has(pubkey);
  }

  /**
   * Vérifie si le cache est valide
   */
  isCacheValid(): boolean {
    return this.cacheExpiry !== null && this.cacheExpiry > new Date();
  }

  /**
   * Obtenir tous les pubkeys MAINNET
   */
  getMainnetPubkeys(): string[] {
    return Array.from(this.mainnetPodIds);
  }

  /**
   * Obtenir les stats
   */
  getStats() {
    return {
      total: this.mainnetPodIds.size,
      lastUpdated: this.lastUpdated,
      cacheValid: this.isCacheValid()
    };
  }
}

// Instance singleton
let registryInstance: MainnetRegistry | null = null;

export function getMainnetRegistry(): MainnetRegistry {
  if (!registryInstance) {
    registryInstance = new MainnetRegistry();
  }
  return registryInstance;
}

/**
 * Helper pour vérifier rapidement si un pubkey est MAINNET
 */
export async function isMainnetNode(pubkey: string): Promise<boolean> {
  const registry = getMainnetRegistry();
  
  // Refresh si nécessaire
  if (!registry.isCacheValid()) {
    try {
      await registry.refreshMainnetList();
    } catch (err) {
      console.warn('Failed to refresh MAINNET list, using cache');
    }
  }
  
  return registry.isMainnet(pubkey);
}
