-- Migration: Add network classification (MAINNET/DEVNET)
-- Date: 2026-01-12
-- Purpose: Distinguish between MAINNET and DEVNET nodes

-- Add network column
ALTER TABLE pnodes 
ADD COLUMN IF NOT EXISTS network VARCHAR(20) DEFAULT 'UNKNOWN';

-- Add network confidence column
ALTER TABLE pnodes 
ADD COLUMN IF NOT EXISTS network_confidence VARCHAR(10);

-- Add network detection method (for debugging/monitoring)
ALTER TABLE pnodes 
ADD COLUMN IF NOT EXISTS network_detection_method VARCHAR(50);

-- Create index for network filtering (performance optimization)
CREATE INDEX IF NOT EXISTS idx_pnodes_network ON pnodes(network);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_pnodes_network_status ON pnodes(network, status);

-- Add comment for documentation
COMMENT ON COLUMN pnodes.network IS 'Network type: MAINNET, DEVNET, or UNKNOWN';
COMMENT ON COLUMN pnodes.network_confidence IS 'Confidence level of network detection: high, medium, low';
COMMENT ON COLUMN pnodes.network_detection_method IS 'Method used to detect network: pubkey_registry, ip_registry, port_heuristic, etc.';

-- Update existing rows to UNKNOWN (will be updated by next crawler run)
UPDATE pnodes 
SET network = 'UNKNOWN', 
    network_confidence = 'low',
    network_detection_method = 'pending_detection'
WHERE network IS NULL;
