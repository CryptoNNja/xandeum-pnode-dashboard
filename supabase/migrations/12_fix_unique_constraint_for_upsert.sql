-- Fix unique constraint on pnodes.ip for proper upsert support
-- Supabase upsert requires a UNIQUE CONSTRAINT, not just a UNIQUE INDEX

-- Step 1: Drop the partial unique index (it doesn't work with ON CONFLICT)
DROP INDEX IF EXISTS idx_pnodes_ip_unique;

-- Step 2: Add a proper UNIQUE constraint on ip column
-- Note: This assumes all existing IPs are unique (which should be the case)
ALTER TABLE pnodes DROP CONSTRAINT IF EXISTS pnodes_ip_unique;
ALTER TABLE pnodes ADD CONSTRAINT pnodes_ip_unique UNIQUE (ip);

-- Step 3: Add a regular (non-unique) index for query performance
CREATE INDEX IF NOT EXISTS idx_pnodes_ip ON pnodes(ip);

-- Verify the constraint was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'pnodes' 
        AND constraint_name = 'pnodes_ip_unique'
        AND constraint_type = 'UNIQUE'
    ) THEN
        RAISE NOTICE '✅ Unique constraint pnodes_ip_unique exists';
    ELSE
        RAISE WARNING '❌ Unique constraint pnodes_ip_unique NOT found';
    END IF;
END $$;
