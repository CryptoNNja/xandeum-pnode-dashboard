-- Table pour stocker les snapshots quotidiens du réseau
CREATE TABLE IF NOT EXISTS network_snapshots (
  id BIGSERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL UNIQUE,
  total_nodes INTEGER NOT NULL DEFAULT 0,
  active_nodes INTEGER NOT NULL DEFAULT 0,
  private_nodes INTEGER NOT NULL DEFAULT 0,
  total_storage_bytes BIGINT NOT NULL DEFAULT 0,
  total_pages BIGINT NOT NULL DEFAULT 0,
  avg_cpu_percent NUMERIC(5,2) DEFAULT 0,
  avg_ram_percent NUMERIC(5,2) DEFAULT 0,
  avg_uptime_hours NUMERIC(10,2) DEFAULT 0,
  network_health_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les requêtes par date
CREATE INDEX IF NOT EXISTS idx_network_snapshots_date ON network_snapshots(snapshot_date DESC);

-- Commentaires
COMMENT ON TABLE network_snapshots IS 'Daily snapshots of network metrics for growth tracking';
COMMENT ON COLUMN network_snapshots.snapshot_date IS 'Date of the snapshot (one per day)';
COMMENT ON COLUMN network_snapshots.total_nodes IS 'Total number of pNodes discovered';
COMMENT ON COLUMN network_snapshots.active_nodes IS 'Number of active (public) pNodes';
COMMENT ON COLUMN network_snapshots.private_nodes IS 'Number of private (gossip_only) pNodes';
COMMENT ON COLUMN network_snapshots.total_storage_bytes IS 'Total committed storage across all active nodes';
COMMENT ON COLUMN network_snapshots.total_pages IS 'Total pages stored across all active nodes';
