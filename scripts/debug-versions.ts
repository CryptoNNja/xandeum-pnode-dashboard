import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: './.env.local' });
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function debugVersions() {
  console.log('🔍 Fetching all pnodes from database...\n');

  const { data: pnodes, error } = await supabaseAdmin
    .from('pnodes')
    .select('ip, version, status');

  if (error) {
    console.error('Error fetching pnodes:', error);
    process.exit(1);
  }

  if (!pnodes || pnodes.length === 0) {
    console.log('No pnodes found in database.');
    process.exit(0);
  }

  console.log(`Total nodes: ${pnodes.length}\n`);

  // Group by version
  const versionMap = new Map<string, { count: number; ips: string[] }>();

  pnodes.forEach((node) => {
    const version = node.version || 'unknown';
    if (!versionMap.has(version)) {
      versionMap.set(version, { count: 0, ips: [] });
    }
    const entry = versionMap.get(version)!;
    entry.count++;
    entry.ips.push(node.ip);
  });

  // Sort by count descending
  const sorted = Array.from(versionMap.entries()).sort((a, b) => b[1].count - a[1].count);

  console.log('📊 Version distribution:\n');
  sorted.forEach(([version, data]) => {
    console.log(`${version.padEnd(20)} → ${data.count} nodes`);
  });

  // Show suspicious versions (v1.0 or anything that looks wrong)
  console.log('\n🚨 Checking for suspicious versions...\n');

  const suspicious = sorted.filter(([version]) => {
    const v = version.toLowerCase();
    return v.includes('1.0') || v.includes('v1.') || (!v.includes('0.') && v !== 'unknown');
  });

  if (suspicious.length === 0) {
    console.log('✅ No suspicious versions found.');
  } else {
    console.log('⚠️  Found suspicious versions:\n');
    suspicious.forEach(([version, data]) => {
      console.log(`Version: ${version}`);
      console.log(`Count: ${data.count}`);
      console.log('IPs:', data.ips.slice(0, 10).join(', '));
      if (data.ips.length > 10) {
        console.log(`... and ${data.ips.length - 10} more`);
      }
      console.log('');
    });
  }

  console.log('\n✨ Debug complete.');
}

debugVersions().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});
