-- Add confidence scoring columns to pnodes table
-- This enables multi-source validation and scoring system

-- Confidence score (0-100)
ALTER TABLE pnodes ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 0;

-- Sources array (gossip, official_api, rpc, etc.)
ALTER TABLE pnodes ADD COLUMN IF NOT EXISTS sources TEXT[] DEFAULT '{}';

-- RPC verification flag
ALTER TABLE pnodes ADD COLUMN IF NOT EXISTS verified_by_rpc BOOLEAN DEFAULT FALSE;

-- Credits from official API
ALTER TABLE pnodes ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Add index for confidence_score for filtering
CREATE INDEX IF NOT EXISTS idx_pnodes_confidence_score ON pnodes(confidence_score);

-- Add index for sources for queries
CREATE INDEX IF NOT EXISTS idx_pnodes_sources ON pnodes USING GIN(sources);

-- Comment
COMMENT ON COLUMN pnodes.confidence_score IS 'Multi-source confidence score (0-100)';
COMMENT ON COLUMN pnodes.sources IS 'Array of sources: gossip, official_api, rpc';
COMMENT ON COLUMN pnodes.verified_by_rpc IS 'Whether node has been verified via RPC call';
COMMENT ON COLUMN pnodes.credits IS 'Pod credits from official API';
