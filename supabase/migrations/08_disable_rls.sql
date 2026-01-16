-- Migration: Disable Row Level Security for pnodes
-- Date: 2026-01-16
-- Purpose: Allow sync scripts to insert registry-only nodes
-- Note: RLS can be re-enabled later with proper policies if needed

ALTER TABLE pnodes DISABLE ROW LEVEL SECURITY;
