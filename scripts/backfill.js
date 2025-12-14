#!/usr/bin/env node

/**
 * Backfill script — Calls the local /api/admin/backfill endpoint
 * Uses BACKFILL_SECRET from .env.local
 * Run with: npm run backfill
 */

const fs = require('fs'); // eslint-disable-line @typescript-eslint/no-require-imports
const path = require('path'); // eslint-disable-line @typescript-eslint/no-require-imports
const http = require('http'); // eslint-disable-line @typescript-eslint/no-require-imports

// Load .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split(/\r?\n/).forEach((line) => {
    // Ignore comments and empty lines
    if (!line || line.trim().startsWith('#')) return;
    const match = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
    if (match) {
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[match[1]] = value;
    }
  });
  // Debug: print all env variables found
  console.log('🔎 Variables trouvées dans .env.local :');
  Object.entries(env).forEach(([k, v]) => console.log(`  ${k} = ${v}`));
  return env;
}

const env = loadEnv();
const secret = env.BACKFILL_SECRET;

if (!secret) {
  console.error('❌ BACKFILL_SECRET not found in .env.local');
  process.exit(1);
}

console.log('🚀 Calling backfill endpoint...');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/backfill',
  method: 'POST',
  headers: {
    'x-backfill-secret': secret,
    'Content-Length': 0,
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log(`✅ Success: inserted ${result.inserted} records (scanned ${result.scanned})`);
      } else {
        console.error(`❌ Error ${res.statusCode}:`, result);
        process.exit(1);
      }
    } catch {
      console.error('❌ Failed to parse response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Connection failed:', err.message);
  console.error('   Make sure Next.js is running on http://localhost:3000');
  console.error('   Run: npm run dev');
  process.exit(1);
});

req.end();
