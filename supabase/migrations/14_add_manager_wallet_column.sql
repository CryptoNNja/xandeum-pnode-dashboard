-- Migration: Add manager_wallet column to pnodes table
-- Purpose: Store the discovered manager wallet address (registrar or buyer)
--          This is different from the node's pubkey (technical identity)
--          and is used to fetch NFTs, SBTs, and token balances

-- Add manager_wallet column
ALTER TABLE pnodes ADD COLUMN IF NOT EXISTS manager_wallet VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pnodes_manager_wallet ON pnodes(manager_wallet);

-- Add comment to explain the column
COMMENT ON COLUMN pnodes.manager_wallet IS 'The manager wallet address (Devnet registrar or Mainnet buyer) that controls this node. Used for fetching NFTs/SBTs/tokens. Different from pubkey which is the node technical identity.';
