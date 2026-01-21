# 🔗 Guide d'Intégration Blockchain

> **Status:** Infrastructure ready, implementation pending  
> The modal shows "Coming Soon" for on-chain data.  
> Follow this guide to implement NFT/SBT/Balance fetching.

**Pour:** Manager Board - Données On-Chain (NFT/SBT/Balance)

---

## 📋 Vue d'Ensemble

Le système `lib/blockchain-data.ts` permet de fetcher les données on-chain pour chaque manager:
- ✅ **Balance XAND** - Solde du wallet
- ✅ **NFTs** - Tokens non-fongibles possédés
- ✅ **SBTs** - Soulbound Tokens (badges, achievements)

**Avec cache intelligent** (TTL 5min) pour éviter de spam le RPC.

---

## 🔧 Étapes d'Implémentation

### 1. Installer les Dépendances

```bash
npm install @solana/web3.js @metaplex-foundation/js
```

### 2. Configurer le RPC Endpoint

Dans `.env.local`:
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# Ou utiliser un RPC privé pour meilleur rate limit:
# NEXT_PUBLIC_SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_KEY
```

### 3. Implémenter les Fonctions

Dans `lib/blockchain-data.ts`, remplacer les TODOs:

#### A. Fetch Balance
```typescript
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export async function fetchWalletBalance(pubkey: string): Promise<WalletBalance | null> {
  try {
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );
    
    const publicKey = new PublicKey(pubkey);
    const balance = await connection.getBalance(publicKey);
    
    // Convert lamports to SOL
    const sol = balance / LAMPORTS_PER_SOL;
    
    // TODO: Fetch XAND token balance
    // const xandMint = new PublicKey('XAND_TOKEN_MINT_ADDRESS');
    // const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    //   publicKey,
    //   { mint: xandMint }
    // );
    
    return {
      sol,
      xand: 0, // TODO: Parse from tokenAccounts
      usd: sol * 200, // TODO: Get real SOL price from API
    };
  } catch (error) {
    console.error('Error fetching balance:', error);
    return null;
  }
}
```

#### B. Fetch NFTs
```typescript
import { Metaplex } from '@metaplex-foundation/js';

export async function fetchWalletNFTs(pubkey: string): Promise<NFTMetadata[]> {
  try {
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
    const metaplex = Metaplex.make(connection);
    
    const publicKey = new PublicKey(pubkey);
    const nfts = await metaplex.nfts().findAllByOwner({ owner: publicKey });
    
    const metadata: NFTMetadata[] = await Promise.all(
      nfts.map(async (nft) => {
        const fullNft = await metaplex.nfts().load({ metadata: nft });
        return {
          mint: nft.address.toBase58(),
          name: fullNft.name,
          symbol: fullNft.symbol,
          image: fullNft.json?.image,
          collection: fullNft.collection?.address.toBase58(),
        };
      })
    );
    
    return metadata;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
}
```

#### C. Fetch SBTs
```typescript
export async function fetchWalletSBTs(pubkey: string): Promise<SBTMetadata[]> {
  // SBTs sont des NFTs avec transfert désactivé
  // Filtrer les NFTs qui ont isMutable=false ou creators spécifiques
  
  try {
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
    const metaplex = Metaplex.make(connection);
    
    const publicKey = new PublicKey(pubkey);
    const nfts = await metaplex.nfts().findAllByOwner({ owner: publicKey });
    
    // Filtrer les SBTs (non-transférables)
    const sbts = nfts.filter(nft => !nft.isMutable); // Example filter
    
    const metadata: SBTMetadata[] = await Promise.all(
      sbts.map(async (sbt) => {
        const fullSbt = await metaplex.nfts().load({ metadata: sbt });
        return {
          mint: sbt.address.toBase58(),
          name: fullSbt.name,
          description: fullSbt.json?.description || '',
          attributes: fullSbt.json?.attributes?.reduce((acc, attr) => {
            acc[attr.trait_type] = attr.value;
            return acc;
          }, {} as Record<string, string>),
        };
      })
    );
    
    return metadata;
  } catch (error) {
    console.error('Error fetching SBTs:', error);
    return [];
  }
}
```

---

## 🔄 Utilisation dans le Modal

Dans `ManagerProfilesModalCompact.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { fetchOnChainData, type OnChainData } from '@/lib/blockchain-data';

// Dans le composant:
const [onChainData, setOnChainData] = useState<OnChainData | null>(null);

useEffect(() => {
  if (selectedManager) {
    fetchOnChainData(selectedManager.pubkey)
      .then(data => setOnChainData(data))
      .catch(err => console.error(err));
  }
}, [selectedManager]);

// Dans le render:
{onChainData && !onChainData.loading && (
  <div>
    <h3>On-Chain Data</h3>
    
    {/* Balance */}
    {onChainData.balance && (
      <div>
        <div>SOL: {onChainData.balance.sol.toFixed(4)}</div>
        <div>XAND: {onChainData.balance.xand.toFixed(2)}</div>
        <div>USD: ${onChainData.balance.usd.toFixed(2)}</div>
      </div>
    )}
    
    {/* NFTs */}
    <div>
      <h4>NFTs ({onChainData.nfts.length})</h4>
      {onChainData.nfts.map(nft => (
        <div key={nft.mint}>
          {nft.image && <img src={nft.image} alt={nft.name} />}
          <div>{nft.name}</div>
        </div>
      ))}
    </div>
    
    {/* SBTs */}
    <div>
      <h4>Achievements ({onChainData.sbts.length})</h4>
      {onChainData.sbts.map(sbt => (
        <div key={sbt.mint}>
          <div>{sbt.name}</div>
          <div>{sbt.description}</div>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## ⚡ Optimisations

### 1. Rate Limiting
```typescript
// Utiliser Bottleneck pour limiter les appels RPC
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 200, // 200ms entre chaque call
});

const balance = await limiter.schedule(() => fetchWalletBalance(pubkey));
```

### 2. Batch Requests
```typescript
// Fetcher plusieurs wallets en parallèle
const managerData = await Promise.all(
  managers.map(m => fetchOnChainData(m.pubkey))
);
```

### 3. Progressive Loading
```typescript
// Charger d'abord la balance, puis NFTs, puis SBTs
const balance = await fetchWalletBalance(pubkey);
setOnChainData(prev => ({ ...prev, balance }));

const nfts = await fetchWalletNFTs(pubkey);
setOnChainData(prev => ({ ...prev, nfts }));

const sbts = await fetchWalletSBTs(pubkey);
setOnChainData(prev => ({ ...prev, sbts }));
```

---

## 🎯 Services RPC Recommandés

### Option 1: RPC Public (Gratuit, Rate-Limited)
```
https://api.mainnet-beta.solana.com
```
- ❌ Rate limits stricts
- ❌ Pas de garantie uptime
- ✅ Gratuit

### Option 2: Helius (Recommandé)
```
https://rpc.helius.xyz/?api-key=YOUR_KEY
```
- ✅ Rate limits généreux (free tier: 100 req/s)
- ✅ 99.9% uptime
- ✅ Enhanced RPC methods
- 💰 Free tier disponible

### Option 3: QuickNode
```
https://your-endpoint.solana-mainnet.quiknode.pro/YOUR_KEY/
```
- ✅ Très rapide
- ✅ Bon support
- 💰 Payant dès le début

### Option 4: Alchemy
```
https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY
```
- ✅ Dashboard analytics
- ✅ Webhooks disponibles
- 💰 Free tier: 300M compute units/mois

---

## 🐛 Debug

### Test manuel dans la console:
```javascript
// Dans DevTools Console
import { fetchOnChainData } from '@/lib/blockchain-data';

const data = await fetchOnChainData('5RgAQwFuABmCXXXXXXXXXXXX');
console.log(data);
```

### Vérifier le cache:
```javascript
import { getCacheStats } from '@/lib/blockchain-data';

console.log(getCacheStats());
// { size: 5, entries: [...] }
```

---

## 📊 Estimation des Coûts

Pour **1000 managers** avec fetch complet:
- Balance: 1000 calls × 0.1ms = ~100ms
- NFTs: 1000 calls × 200ms = ~200s
- SBTs: 1000 calls × 150ms = ~150s

**Total: ~6 minutes** (si séquentiel)

**Avec parallélisation (10 concurrent):** ~36 secondes

**Avec cache (5min TTL):** Quasi instantané après premier fetch

---

## ✅ Checklist d'Implémentation

- [ ] Installer @solana/web3.js
- [ ] Installer @metaplex-foundation/js
- [ ] Configurer SOLANA_RPC_URL
- [ ] Implémenter fetchWalletBalance
- [ ] Implémenter fetchWalletNFTs
- [ ] Implémenter fetchWalletSBTs
- [ ] Intégrer dans ManagerProfilesModalCompact
- [ ] Tester avec wallet réel
- [ ] Ajouter loading states
- [ ] Ajouter error handling
- [ ] Optimiser avec rate limiting

---

**Questions?** Ce guide couvre tout le nécessaire pour l'intégration blockchain! 🚀
