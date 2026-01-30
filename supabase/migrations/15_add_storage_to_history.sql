-- Migration: Add storage_committed and storage_used columns to pnode_history
-- This enables semi-real-time storage trend tracking in the dashboard

-- Add storage columns to pnode_history table
ALTER TABLE pnode_history 
  ADD COLUMN IF NOT EXISTS storage_committed BIGINT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT NULL;

-- Add indexes for performance on storage queries
CREATE INDEX IF NOT EXISTS idx_pnode_history_storage_committed 
  ON pnode_history(storage_committed) 
  WHERE storage_committed IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pnode_history_storage_used 
  ON pnode_history(storage_used) 
  WHERE storage_used IS NOT NULL;

-- Add composite index for time-series storage queries
CREATE INDEX IF NOT EXISTS idx_pnode_history_ts_storage 
  ON pnode_history(ts DESC, storage_committed, storage_used)
  WHERE storage_committed IS NOT NULL;

-- Comments
COMMENT ON COLUMN pnode_history.storage_committed IS 'Storage committed by this pNode at this timestamp (bytes)';
COMMENT ON COLUMN pnode_history.storage_used IS 'Storage actually used by this pNode at this timestamp (bytes)';
