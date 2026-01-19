-- Retention policy: Keep detailed history for 30 days, then delete
-- This prevents the table from exploding (52M rows/year without cleanup)
-- 
-- Context: With 500 nodes and 5min crawls:
-- - 500 nodes × 12 runs/hour × 24h = 144,000 rows/day
-- - Without cleanup: 52,560,000 rows/year
-- - With 30-day retention: ~4,320,000 rows max (manageable)

-- Create function to clean old history
CREATE OR REPLACE FUNCTION cleanup_old_history()
RETURNS TABLE(deleted_count bigint) AS $$
DECLARE
    rows_deleted bigint;
    cutoff_timestamp bigint;
BEGIN
    -- Calculate 30 days ago in Unix timestamp (seconds)
    cutoff_timestamp := EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days'))::bigint;
    
    DELETE FROM pnode_history
    WHERE ts < cutoff_timestamp;
    
    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    
    RAISE NOTICE 'Cleaned up % history records older than 30 days', rows_deleted;
    
    RETURN QUERY SELECT rows_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_history IS 
'Deletes pnode_history records older than 30 days. 
Run daily via scheduled task to prevent table explosion.
Expected cleanup: ~144,000 rows/day for 500 nodes with 5min crawls.';

-- Add index for efficient cleanup queries
-- This index helps the DELETE query find old records quickly
-- Note: Using ts (unix timestamp) instead of recorded_at
-- Cannot use WHERE clause with NOW() as it's not IMMUTABLE, so we index all ts values
CREATE INDEX IF NOT EXISTS idx_pnode_history_ts 
ON pnode_history(ts);

-- Add index to speed up dashboard queries (most recent history per node)
CREATE INDEX IF NOT EXISTS idx_pnode_history_ip_recent 
ON pnode_history(ip, ts DESC);

COMMENT ON INDEX idx_pnode_history_ts IS 
'Index on timestamp for efficient cleanup and time-range queries';

COMMENT ON INDEX idx_pnode_history_ip_recent IS 
'Composite index for fast retrieval of recent history per node (dashboard queries)';
