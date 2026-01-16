-- Migration: Add MAINNET/DEVNET breakdown to network_snapshots
-- Date: 2026-01-16
-- Purpose: Track historical data for Public/Private nodes by network type

-- Add columns for network-specific breakdown
ALTER TABLE network_snapshots ADD COLUMN IF NOT EXISTS mainnet_public INTEGER DEFAULT 0;
ALTER TABLE network_snapshots ADD COLUMN IF NOT EXISTS mainnet_private INTEGER DEFAULT 0;
ALTER TABLE network_snapshots ADD COLUMN IF NOT EXISTS devnet_public INTEGER DEFAULT 0;
ALTER TABLE network_snapshots ADD COLUMN IF NOT EXISTS devnet_private INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_network_snapshots_mainnet_public ON network_snapshots(mainnet_public);
CREATE INDEX IF NOT EXISTS idx_network_snapshots_devnet_public ON network_snapshots(devnet_public);

COMMENT ON COLUMN network_snapshots.mainnet_public IS 'Number of public nodes on MAINNET at snapshot time';
COMMENT ON COLUMN network_snapshots.mainnet_private IS 'Number of private nodes on MAINNET at snapshot time';
COMMENT ON COLUMN network_snapshots.devnet_public IS 'Number of public nodes on DEVNET at snapshot time';
COMMENT ON COLUMN network_snapshots.devnet_private IS 'Number of private nodes on DEVNET at snapshot time';
