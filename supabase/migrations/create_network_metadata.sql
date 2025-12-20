-- Network metadata table to store discovery stats
-- This tracks the total network size discovered via gossip/RPC
-- vs the actual nodes we successfully crawled and enriched

CREATE TABLE IF NOT EXISTS network_metadata (
  id BIGSERIAL PRIMARY KEY,
  network_total INTEGER NOT NULL DEFAULT 0, -- Total nodes discovered via gossip
  crawled_nodes INTEGER NOT NULL DEFAULT 0, -- Nodes we successfully enriched
  active_nodes INTEGER NOT NULL DEFAULT 0, -- Nodes with active RPC
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only keep one row (singleton pattern)
-- Use id = 1 for the single network metadata record
CREATE UNIQUE INDEX IF NOT EXISTS idx_network_metadata_singleton ON network_metadata(id) WHERE id = 1;

-- Insert initial record
INSERT INTO network_metadata (id, network_total, crawled_nodes, active_nodes, last_updated)
VALUES (1, 0, 0, 0, NOW())
ON CONFLICT (id) DO NOTHING;
