-- Migration de base : Création des tables principales
-- À exécuter EN PREMIER

-- Table principale des pnodes
CREATE TABLE IF NOT EXISTS pnodes (
  id BIGSERIAL PRIMARY KEY,
  ip VARCHAR(45) NOT NULL UNIQUE,
  version VARCHAR(50),
  network VARCHAR(20), -- 'MAINNET', 'DEVNET', ou NULL
  status VARCHAR(20), -- 'active', 'gossip_only', etc.
  
  -- Confidence scoring
  confidence_score INTEGER DEFAULT 0,
  last_seen_gossip TIMESTAMP WITH TIME ZONE,
  last_seen_rpc TIMESTAMP WITH TIME ZONE,
  seen_in_official_api BOOLEAN DEFAULT FALSE,
  
  -- Stats
  stats JSONB, -- Contient: cpu_percent, ram_used, ram_total, storage_committed, storage_used, uptime, etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_crawl_at TIMESTAMP WITH TIME ZONE
);

-- Table historique des pnodes
CREATE TABLE IF NOT EXISTS pnode_history (
  id BIGSERIAL PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  version VARCHAR(50),
  network VARCHAR(20),
  status VARCHAR(20),
  stats JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (ip) REFERENCES pnodes(ip) ON DELETE CASCADE
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_pnodes_ip ON pnodes(ip);
CREATE INDEX IF NOT EXISTS idx_pnodes_network ON pnodes(network);
CREATE INDEX IF NOT EXISTS idx_pnodes_status ON pnodes(status);
CREATE INDEX IF NOT EXISTS idx_pnodes_updated_at ON pnodes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pnode_history_ip ON pnode_history(ip);
CREATE INDEX IF NOT EXISTS idx_pnode_history_recorded_at ON pnode_history(recorded_at DESC);

-- Commentaires
COMMENT ON TABLE pnodes IS 'Table principale stockant les pnodes du réseau Xandeum';
COMMENT ON TABLE pnode_history IS 'Historique des métriques des pnodes pour analytics';
