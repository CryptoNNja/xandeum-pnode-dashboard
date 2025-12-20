import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkStorageValues() {
  console.log('🔍 Checking storage_committed values in database...\n');

  const { data: nodes, error } = await supabase
    .from('pnodes')
    .select('ip, stats')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  nodes?.forEach((node) => {
    const stats = node.stats as any;
    console.log(`IP: ${node.ip}`);
    console.log(`  storage_committed: ${stats?.storage_committed}`);
    console.log(`  file_size: ${stats?.file_size}`);
    console.log('');
  });

  // Calculate total
  const { data: allNodes } = await supabase
    .from('pnodes')
    .select('stats');

  let totalCommitted = 0;
  let count = 0;

  allNodes?.forEach((node) => {
    const stats = node.stats as any;
    if (stats?.storage_committed) {
      totalCommitted += stats.storage_committed;
      count++;
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`  Nodes with storage_committed: ${count}`);
  console.log(`  Total storage_committed (raw): ${totalCommitted}`);
  console.log(`  Average per node: ${(totalCommitted / count).toFixed(2)}`);
  console.log(`  If in bytes → TB: ${(totalCommitted / (1024 ** 4)).toFixed(2)} TB`);
  console.log(`  If in GB → TB: ${(totalCommitted / 1024).toFixed(2)} TB`);
  console.log(`  If in MB → TB: ${(totalCommitted / (1024 ** 2)).toFixed(2)} TB`);
}

checkStorageValues();
