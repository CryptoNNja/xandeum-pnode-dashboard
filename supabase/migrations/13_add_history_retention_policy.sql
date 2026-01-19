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
BEGIN
    DELETE FROM pnode_history
    WHERE recorded_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    
    RAISE NOTICE 'Cleaned up % history records older than 30 days', rows_deleted;
    
    RETURN QUERY SELECT rows_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_history IS 
'Deletes pnode_history records older than 30 days. 
Run daily via scheduled task to prevent table explosion.
Expected cleanup: ~144,000 rows/day for 500 nodes with 5min crawls.';

-- Add composite index for efficient cleanup queries
-- This index helps the DELETE query find old records quickly
CREATE INDEX IF NOT EXISTS idx_pnode_history_cleanup 
ON pnode_history(recorded_at) 
WHERE recorded_at < NOW() - INTERVAL '30 days';

-- Add index to speed up dashboard queries (most recent history per node)
CREATE INDEX IF NOT EXISTS idx_pnode_history_ip_recent 
ON pnode_history(ip, recorded_at DESC);

COMMENT ON INDEX idx_pnode_history_cleanup IS 
'Partial index for efficient cleanup of old history records (>30 days)';

COMMENT ON INDEX idx_pnode_history_ip_recent IS 
'Composite index for fast retrieval of recent history per node (dashboard queries)';
