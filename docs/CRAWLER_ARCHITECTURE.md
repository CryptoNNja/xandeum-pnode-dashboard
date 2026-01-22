# 🕷️ Xandeum pNode Crawler - Architecture Complète

## 📋 Vue d'Ensemble

Le crawler est le **cœur du système de monitoring**. Il découvre, surveille et collecte les données de **tous les pNodes** du réseau Xandeum (MAINNET et DEVNET).

**Exécution:** Toutes les **30 minutes** via GitHub Actions  
**Fichier:** `scripts/crawler.ts` (1102 lignes)  
**Workflow:** `.github/workflows/crawler.yml`

---

## 🎯 Objectifs du Crawler

1. **Découverte réseau** - Trouver tous les pNodes via gossip + RPC
2. **Collecte de données** - Stats, métadonnées, géolocalisation
3. **Classification** - MAINNET/DEVNET, status (active/gossip/stale)
4. **Historique** - Tracking des changements dans le temps
5. **Nettoyage** - Supprimer/marquer les "zombie nodes"

---

## 🔄 Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS                            │
│              Cron: */30 * * * * (every 30 min)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  CRAWLER MAIN FUNCTION                       │
│                   scripts/crawler.ts                         │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   PHASE 0             PHASE 1             PHASE 2
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Official   │  │   Network    │  │     Data     │
│  Registries  │  │  Discovery   │  │  Enrichment  │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │   SUPABASE DATABASE    │
               │  • pnodes              │
               │  • pnode_history       │
               │  • network_metadata    │
               └────────────────────────┘
```

---

## 📡 Phase 0: Official Registries

**Objectif:** Récupérer les listes officielles de pNodes depuis les APIs Xandeum

### Sources de Données

1. **MAINNET API**
   ```
   https://mainnet.xandeum.com/get-nodes
   ```

2. **DEVNET API**
   ```
   https://devnet.xandeum.com/get-nodes
   ```

### Données Collectées

```typescript
interface OfficialNode {
  pubkey: string;      // Clé publique du node
  credits: number;     // Crédits STOINC accumulés
  network: "MAINNET" | "DEVNET";
}
```

### Fonctionnalité

- **`fetchOfficialRegistries()`** (dans `lib/official-apis.ts`)
- Retourne:
  - `Set<pubkey>` pour MAINNET et DEVNET
  - `Map<pubkey, credits>` pour les crédits
  - Compteurs par réseau

**Utilité:**
- Classifier les nodes (MAINNET vs DEVNET)
- Calculer le **confidence score** (nodes officiels = plus fiables)
- Récupérer les crédits STOINC

---

## 🔍 Phase 1: Network Discovery

**Objectif:** Découvrir TOUS les pNodes du réseau via propagation

### Algorithme de Découverte (BFS Parallélisé)

```
1. START avec bootstrap nodes (config/bootstrap.json)
2. POUR chaque node découvert:
   a) Query GOSSIP endpoint (port 5000)
   b) Query RPC endpoint (port 6000/9000)
   c) Extraire les peers (IPs des autres nodes)
3. AJOUTER les nouveaux peers à la queue
4. RÉPÉTER jusqu'à épuisement de la queue
```

### Endpoints Interrogés

#### 1. **Gossip Endpoint** (Port 5000)
```http
GET http://<IP>:5000/gossip
```

**Réponse:**
```json
{
  "pnodes": [
    { "ip": "1.2.3.4" },
    { "ip": "5.6.7.8" },
    ...
  ]
}
```

#### 2. **RPC Endpoint** (Port 6000 ou 9000)
```http
POST http://<IP>:6000/rpc
{
  "jsonrpc": "2.0",
  "method": "get-pods",
  "id": 1
}
```

**Réponse:**
```json
{
  "result": {
    "pods": [
      { "address": "1.2.3.4:6000" },
      { "address": "5.6.7.8:6000" },
      ...
    ]
  }
}
```

### Optimisations de Performance

1. **Batch Processing** - 10 nodes en parallèle (DISCOVERY_CONCURRENCY)
2. **Port Fallback** - Teste port 6000, puis 9000 si échec
3. **Timeouts** - 5000ms max par requête
4. **Deduplication** - Set pour éviter les doublons

### Résultat Phase 1

- Liste complète des IPs découverts
- ~300+ nodes typiquement (MAINNET + DEVNET)

---

## 📊 Phase 2: Data Enrichment

**Objectif:** Collecter les métadonnées et stats pour chaque node

### Étape 2.1: Métadonnées (get-pods-with-stats)

**Endpoint RPC:**
```http
POST http://<IP>:6000/rpc
{
  "jsonrpc": "2.0",
  "method": "get-pods-with-stats",
  "id": 1
}
```

**Données Collectées:**
```typescript
interface PodMetadata {
  address: string;           // IP:port
  version: string;           // ex: "0.15.3"
  pubkey: string;            // Clé publique
  storage_committed: number; // GB committés
  storage_used: number;      // GB utilisés
  uptime: number;            // Secondes
  is_public: boolean;        // Node public?
  rpc_port: number;          // Port RPC
  last_seen_timestamp: number; // Dernier vu (gossip)
}
```

**Batch Processing:**
- 100 nodes en parallèle (METADATA_BATCH_SIZE)
- Construction de Maps pour accès O(1):
  - `versionMap`
  - `pubkeyMap`
  - `storageCommittedMap`
  - `storageUsedMap`
  - `isPublicMap`
  - `rpcPortMap`
  - `lastSeenGossipMap`
  - `uptimeGossipMap`

---

### Étape 2.2: Stats Détaillées (get-stats)

**Endpoint RPC:**
```http
POST http://<IP>:6000/rpc
{
  "jsonrpc": "2.0",
  "method": "get-stats",
  "id": 1
}
```

**Données Collectées:**
```typescript
interface PNodeStats {
  active_streams: number;     // Streams actifs
  cpu_percent: number;        // CPU usage %
  current_index: number;      // Index actuel
  file_size: number;          // Taille fichier
  last_updated: number;       // Timestamp
  packets_received: number;   // Paquets reçus
  packets_sent: number;       // Paquets envoyés
  ram_total: number;          // RAM totale
  ram_used: number;           // RAM utilisée
  total_bytes: number;        // Bytes totaux
  total_pages: number;        // Pages totales
  uptime: number;             // Uptime en secondes
}
```

**Optimisations:**
- Batch: 100 nodes en parallèle (BATCH_SIZE)
- Port prioritaire: Utilise `rpc_port` de l'étape 2.1 si disponible
- Fallback automatique si échec

**Taux de Succès:**
- ~70-80% des nodes répondent à get-stats
- Les autres sont marqués comme "gossip_only"

---

### Étape 2.3: Géolocalisation

**Objectif:** Déterminer la localisation géographique de chaque IP

#### Providers Utilisés (avec fallback)

**1. Primary: ipwho.is** (Gratuit)
```http
GET https://ipwho.is/<IP>?fields=success,latitude,longitude,city,country,country_code
```

**2. Fallback 1: ip-api.com** (Gratuit, 45 req/min)
```http
GET http://ip-api.com/json/<IP>?fields=lat,lon,city,country,countryCode
```

**3. Fallback 2: ipapi.co** (Gratuit, rate-limited)
```http
GET https://ipapi.co/<IP>/json/
```

#### Système de Cache Intelligent

```typescript
// Phase 2.3 geolocate only NEW IPs
cachedIps = IPs with existing lat/lng in DB
newIps = IPs without geolocation

// Skip API calls for cachedIps (reuse DB data)
// Only geolocate newIps through rate limiter
```

**Avantages:**
- Évite les appels API inutiles
- Respecte les rate limits (44 req/min avec Bottleneck)
- Accélère considérablement le crawl (~90% des IPs sont en cache)

#### Rate Limiting (Bottleneck)

```typescript
const limiter = new Bottleneck({
  maxConcurrent: 1,   // 1 requête à la fois
  minTime: 1350,      // 1.35s entre chaque (~44 req/min)
});
```

**Données Collectées:**
```typescript
interface GeolocationData {
  lat: number;          // Latitude
  lng: number;          // Longitude
  city: string;         // Ville
  country: string;      // Pays
  country_code: string; // Code ISO (US, FR, etc.)
}
```

---

### Étape 2.4: Classification & Scoring

#### 1. **Network Classification**

**Méthode:** `networkDetector.classifyNode(pubkey)`

```typescript
if (pubkey in mainnetRegistry) → MAINNET
else if (pubkey in devnetRegistry) → DEVNET
else → UNKNOWN
```

#### 2. **Status Classification**

```typescript
if (has_stats && uptime > 0) → "active"
else if (has_gossip_data) → "gossip_only"
else if (failed_checks >= 2) → "stale"
```

**Types de Status:**
- **active**: Node répond au RPC et a des stats
- **gossip_only**: Visible dans gossip mais ne répond pas au RPC (souvent privé)
- **stale**: N'a pas répondu depuis 2+ crawls

#### 3. **Confidence Score** (0-100)

**Calcul:** `calculateConfidence(node)` dans `lib/confidence-scoring.ts`

**Critères:**
- ✅ **Uptime** (35 pts) - Node opérationnel
- ✅ **Version consensus** (25 pts) - Version majoritaire
- ✅ **Pubkey verification** (20 pts) - Pubkey valide
- ✅ **Official registry** (30 pts) - Dans registre officiel
- ✅ **Storage contribution** (10 pts) - Stockage committé

**Exemple:**
```typescript
Node A: uptime=99%, version=majority, pubkey=valid, official=yes, storage=100GB
→ Confidence = 35 + 25 + 20 + 30 + 10 = 120 (plafonné à 100)
```

#### 4. **Credits STOINC**

**Source:** Official registries API

```typescript
const credits = officialRegistries.mainnetCredits.get(pubkey) ||
                officialRegistries.devnetCredits.get(pubkey) ||
                0;
```

---

## 💾 Phase 3: Database Save

### Tables Supabase

#### 1. **pnodes** (Table principale)

```sql
CREATE TABLE pnodes (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(45) UNIQUE NOT NULL,
  network network_type,
  status pnode_status,
  version TEXT,
  pubkey TEXT,
  
  -- Stats
  uptime NUMERIC,
  cpu_percent NUMERIC,
  ram_used BIGINT,
  ram_total BIGINT,
  storage_committed NUMERIC,
  storage_used NUMERIC,
  
  -- Geolocation
  lat NUMERIC,
  lng NUMERIC,
  city TEXT,
  country TEXT,
  country_code VARCHAR(2),
  
  -- Scoring
  confidence_score INTEGER,
  credits NUMERIC,
  
  -- Metadata
  last_crawled_at TIMESTAMPTZ,
  failed_checks INTEGER DEFAULT 0,
  last_seen_gossip TIMESTAMPTZ,
  
  -- Manager wallet
  manager_wallet TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Upsert Strategy:**
```typescript
await supabase
  .from('pnodes')
  .upsert(nodes, { onConflict: 'ip' });
```

- **Conflict:** Si IP existe, mise à jour
- **New:** Si nouvelle IP, insertion

#### 2. **pnode_history** (Historique)

```sql
CREATE TABLE pnode_history (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  
  -- Changements trackés
  status pnode_status,
  uptime NUMERIC,
  cpu_percent NUMERIC,
  confidence_score INTEGER,
  
  -- Index pour queries rapides
  INDEX idx_history_ip_timestamp (ip, timestamp DESC)
);
```

**Politique de rétention:** 7 jours (via trigger automatique)

**Insertion:**
```typescript
// Seulement si changement significatif
if (needsHistoryEntry(node)) {
  await supabase.from('pnode_history').insert({
    ip: node.ip,
    timestamp: now,
    status: node.status,
    uptime: node.uptime,
    ...
  });
}
```

#### 3. **network_metadata** (Singleton)

```sql
CREATE TABLE network_metadata (
  id INTEGER PRIMARY KEY DEFAULT 1,
  network_total INTEGER,      -- Total nodes découverts
  crawled_nodes INTEGER,      -- Nodes crawlés avec succès
  active_nodes INTEGER,       -- Nodes avec status=active
  last_updated TIMESTAMPTZ,
  
  CONSTRAINT single_row CHECK (id = 1)
);
```

**Update:**
```typescript
await supabase.from('network_metadata').upsert({
  id: 1,
  network_total: discoveredIPs.length,
  crawled_nodes: successfulNodes.length,
  active_nodes: activeCount,
  last_updated: new Date().toISOString()
}, { onConflict: 'id' });
```

---

## 🧹 Phase 4: Zombie Cleanup

**Objectif:** Nettoyer les nodes "morts" ou inaccessibles

### Définition d'un Zombie

**Logique hybride:**

```typescript
const isZombie =
  (failed_checks >= 2 && !hasGossipData) ||  // Vraiment mort
  (failed_checks >= 4 && hasGossipData);     // Problèmes persistants
```

**`hasGossipData`:**
- Node a une version connue
- Node a un pubkey connu
- Node a du storage committé

### Comportement (Configurable)

#### Mode 1: DELETE (Default)
```typescript
KEEP_ZOMBIES = false (default)

→ DELETE zombies from pnodes
```

#### Mode 2: STALE (Keep for coverage)
```typescript
KEEP_ZOMBIES = true

→ UPDATE status='stale' WHERE ip IN (zombies)
```

**Avantages du mode STALE:**
- Garde la couverture réseau complète
- Permet d'analyser les patterns de défaillance
- Historique préservé

### Exclusions

**Private nodes EXCLUS du cleanup:**
```typescript
if (ip.startsWith('PRIVATE-')) {
  // Ne PAS marquer comme zombie
  // Ces nodes sont injoignables par design
}
```

---

## ⚙️ Configuration & Variables d'Environnement

### Variables Requises

```bash
# Supabase (Requis)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Geolocation (Optionnel, améliore rate limits)
IPWHO_API_KEY=xxx
```

### Variables Optionnelles (Flags)

```bash
# Keep zombies as "stale" instead of deleting
CRAWLER_KEEP_ZOMBIES=1

# Enable port fallbacks (6000, 9000)
CRAWLER_PORT_FALLBACKS=1

# Environment
NODE_ENV=production
```

### Bootstrap Nodes

**Fichier:** `config/bootstrap.json`

```json
{
  "seeds": [
    "1.2.3.4",
    "5.6.7.8",
    "9.10.11.12"
  ]
}
```

**Rôle:** Points d'entrée initiaux pour la découverte réseau

---

## 📊 Métriques & Logging

### Statistiques Trackées

Le crawler affiche en temps réel:

```
📡 get-stats calls: 300
   ✅ Success: 240 (80%)
   ❌ Failed: 60 (20%)
   
📊 Port usage:
   - Port 6000: 220 nodes (91.6%)
   - Port 9000: 20 nodes (8.4%)

📡 get-pods-with-stats calls: 300
   ✅ Success (pods>0): 285
   📦 Total pods returned: 8550 (avg: 30 pods/node)

📍 Geolocation:
   📊 Cached: 270 IPs (90%)
   🆕 New: 30 IPs (10%)
   ⏱️  Time: 45.2s

💾 Database:
   ✅ Saved: 300 nodes
   📝 History: 180 entries
   🧹 Zombies: 5 marked as stale
```

### Logs Détaillés

Le crawler produit des logs structurés:

```
🕷️ Starting network crawl...
================================================

📡 PHASE 0: Fetching Official Registries...
✅ MAINNET: 32 official nodes
✅ DEVNET: 268 official nodes

🌐 Initializing network detector...
✅ Network registry loaded: 32 MAINNET, 268 DEVNET

🔍 PHASE 1: Network Discovery...
🔍 Querying 10 nodes in parallel...
✅ Discovery complete. Found 305 unique nodes

📊 PHASE 2: Data Enrichment...
📡 Fetching metadata...
  Fetched metadata for 100/305 nodes...
  Fetched metadata for 200/305 nodes...
  Fetched metadata for 305/305 nodes...
✅ Metadata discovery complete

📊 Fetching stats...
  Fetched stats for 100/305 nodes...
  Fetched stats for 200/305 nodes...
  Fetched stats for 305/305 nodes...

📍 Geolocating 305 IPs...
   📊 Cache: 275 cached, 30 new IPs
   ✅ Geolocation complete (42.3s)

💾 PHASE 3: Database Save...
💾 Saving 305 unique nodes...
✅ Successfully saved pnodes data
📊 Updating network metadata: 305 total, 305 crawled, 240 active
✅ Network metadata updated
💾 Saving 180 history records...
✅ Successfully saved history data

🧹 PHASE 4: Zombie Cleanup...
🗑️  Found 5 zombie nodes
✅ Marked 5 nodes as stale

================================================
✅ Crawl completed successfully!
Total time: 2m 15s
```

---

## 🔧 Optimisations de Performance

### 1. Parallelisation Massive

```typescript
// Discovery: 10 concurrent
const DISCOVERY_CONCURRENCY = 10;

// Metadata: 100 concurrent
const METADATA_BATCH_SIZE = 100;

// Stats: 100 concurrent
const BATCH_SIZE = 100;
```

### 2. Rate Limiting Intelligent

```typescript
// Geolocation: 44 req/min pour respecter ip-api.com
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1350, // 1.35s = ~44 req/min
});
```

### 3. Caching Agressif

- **Géolocalisation:** Réutilise 90% des données existantes
- **Metadata:** Maps en mémoire pour O(1) lookup
- **Network registry:** Chargé une fois au début

### 4. Timeouts Courts

```typescript
const TIMEOUT = 5000; // 5s max par requête
```

**Avantages:**
- Évite de bloquer sur nodes lents
- Crawl complet en ~2-3 minutes

### 5. Port Fallback Strategy

```typescript
// Essaie d'abord le port préféré du node
const preferred = rpcPortMap.get(ip);
const ports = preferred 
  ? [preferred, ...DEFAULT_PRPC_PORTS.filter(p => p !== preferred)]
  : DEFAULT_PRPC_PORTS; // [6000, 9000]
```

---

## 🚀 Déploiement & Exécution

### GitHub Actions (Production)

**Fichier:** `.github/workflows/crawler.yml`

```yaml
on:
  schedule:
    - cron: '*/30 * * * *'  # Toutes les 30 minutes
  workflow_dispatch:        # Manual trigger
```

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run crawler (`npx tsx scripts/crawler.ts`)
5. Save daily snapshot (`scripts/save-daily-snapshot.ts`)

**Timeout:** 15 minutes (sécurité)

### Exécution Locale

```bash
# Setup env
cp .env.example .env.local
# Edit .env.local avec tes credentials

# Run crawler
npx tsx scripts/crawler.ts

# Avec options
CRAWLER_KEEP_ZOMBIES=1 npx tsx scripts/crawler.ts
CRAWLER_PORT_FALLBACKS=1 npx tsx scripts/crawler.ts
```

### Manual Trigger (GitHub UI)

1. Va sur **Actions** tab
2. Sélectionne **Xandeum pNodes Crawler**
3. Clique **Run workflow**
4. Options:
   - ✅ Enable port fallbacks (6000/9000)
   - ✅ Keep zombies (stale instead of delete)

---

## 📈 Améliorations Futures

### Court Terme
- [ ] **WebSocket real-time** au lieu de polling 30 min
- [ ] **Prometheus metrics** export pour monitoring
- [ ] **Alerting** sur anomalies réseau
- [ ] **Retry logic** avec backoff exponentiel

### Moyen Terme
- [ ] **Distributed crawling** pour scale horizontale
- [ ] **Node health predictions** avec ML
- [ ] **Geographic routing** optimisé
- [ ] **Custom scoring** configurable par utilisateur

### Long Terme
- [ ] **Full mesh topology** mapping
- [ ] **Network simulation** pour prédire comportement
- [ ] **Auto-tuning** des paramètres de crawl
- [ ] **Multi-chain support** (autres blockchains)

---

## 🐛 Troubleshooting

### Problème: Crawler timeout (>15 min)

**Causes:**
- Trop de nouveaux nodes à géolocaliser
- Rate limits sur APIs géolocation
- Nodes très lents qui bloquent

**Solutions:**
```bash
# Augmenter le cache geolocation
# Réduire BATCH_SIZE si rate limits
# Augmenter timeout dans workflow.yml
```

### Problème: Beaucoup de "failed_checks"

**Causes:**
- Nodes réellement down
- Firewall bloquant crawler
- Mauvaises IPs dans bootstrap

**Solutions:**
```bash
# Activer KEEP_ZOMBIES=1 pour analyser
# Vérifier bootstrap.json
# Tester manuellement avec curl
curl http://<IP>:5000/gossip
curl -X POST http://<IP>:6000/rpc \
  -d '{"jsonrpc":"2.0","method":"get-stats","id":1}'
```

### Problème: Géolocalisation bloquée

**Causes:**
- Rate limits ip-api.com (45 req/min)
- IPs invalides/privées
- Provider API down

**Solutions:**
```bash
# Vérifier que 90%+ sont en cache
# Bottleneck devrait gérer automatiquement
# Fallback vers ipapi.co si besoin
```

---

## 📚 Fichiers Liés

| Fichier | Rôle |
|---------|------|
| `scripts/crawler.ts` | Crawler principal (1102 lignes) |
| `scripts/crawler-types.ts` | Types TypeScript |
| `scripts/save-daily-snapshot.ts` | Snapshot quotidien |
| `.github/workflows/crawler.yml` | GitHub Actions config |
| `config/bootstrap.json` | Bootstrap nodes |
| `lib/official-apis.ts` | Fetch registries officiels |
| `lib/network-detector.ts` | Classification MAINNET/DEVNET |
| `lib/confidence-scoring.ts` | Calcul confidence score |

---

**Dernière mise à jour:** 2026-01-21  
**Version:** 2.0 (Manager Board integrated)
