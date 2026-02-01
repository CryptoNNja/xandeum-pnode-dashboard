-- Add version column to pnode_history for accurate historical tracking
ALTER TABLE pnode_history 
ADD COLUMN IF NOT EXISTS version TEXT;

-- Add index for performance on version queries
CREATE INDEX IF NOT EXISTS idx_pnode_history_version 
ON pnode_history(version);

-- Add comment
COMMENT ON COLUMN pnode_history.version IS 'Node version at time of snapshot for historical version consensus tracking';
