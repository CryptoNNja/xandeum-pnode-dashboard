-- Verify and fix unique constraint on pnodes.ip
-- This ensures upsert with onConflict: 'ip' works correctly

-- Drop old constraint if it exists (from initial migration)
ALTER TABLE pnodes DROP CONSTRAINT IF EXISTS pnodes_ip_key;

-- Create unique index on ip (partial index for non-null values)
-- This allows upsert with onConflict: 'ip' to work
DROP INDEX IF EXISTS idx_pnodes_ip_unique;
CREATE UNIQUE INDEX idx_pnodes_ip_unique ON pnodes(ip) WHERE ip IS NOT NULL;

-- Verify the index was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'pnodes' 
        AND indexname = 'idx_pnodes_ip_unique'
    ) THEN
        RAISE NOTICE '✅ Unique index idx_pnodes_ip_unique exists';
    ELSE
        RAISE WARNING '❌ Unique index idx_pnodes_ip_unique NOT found';
    END IF;
END $$;
