-- Migration: Configure Row Level Security for pnodes
-- Date: 2026-01-16
-- Purpose: Allow sync scripts to insert registry-only nodes while keeping RLS enabled
-- Note: Sync scripts use Supabase service_role key for privileged access

-- Ensure Row Level Security is enabled on the pnodes table
ALTER TABLE pnodes ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "pnodes_service_role_full_access" ON pnodes;

-- Allow the Supabase service role to perform any operation on pnodes
-- This lets backend sync scripts insert/update/delete/query registry-only nodes
CREATE POLICY "pnodes_service_role_full_access"
  ON pnodes
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Optional: Allow public read access (if needed for frontend)
-- Uncomment if you want anonymous users to read node data
-- DROP POLICY IF EXISTS "pnodes_public_read_access" ON pnodes;
-- CREATE POLICY "pnodes_public_read_access"
--   ON pnodes
--   FOR SELECT
--   USING (true);
