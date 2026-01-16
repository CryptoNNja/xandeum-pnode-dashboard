#!/usr/bin/env node

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

// Then run the TypeScript script
require('child_process').execSync('npx tsx scripts/sync-mainnet-registry.ts', {
  stdio: 'inherit',
  env: process.env
});
