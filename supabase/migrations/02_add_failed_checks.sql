-- Add failed_checks column to track consecutive crawl failures
-- This allows detection of truly dead/zombie nodes

ALTER TABLE pnodes 
ADD COLUMN IF NOT EXISTS failed_checks INTEGER DEFAULT 0;

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_pnodes_failed_checks 
ON pnodes(failed_checks) 
WHERE failed_checks > 0;

-- Comment for documentation
COMMENT ON COLUMN pnodes.failed_checks IS 
'Number of consecutive crawls where this node was inaccessible. Reset to 0 when node responds. Nodes with failed_checks >= 3 are considered zombies and can be deleted.';
