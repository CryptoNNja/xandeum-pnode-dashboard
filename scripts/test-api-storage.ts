import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testApiStorage() {
  console.log('🔍 Fetching all pnodes from database (simulating API)...\n');

  const { data: pnodes } = await supabase
    .from('pnodes')
    .select('ip, status, stats')
    .order('ip');

  if (!pnodes) {
    console.error('No data');
    return;
  }

  // Calculate total storage committed from ALL nodes (same logic as frontend)
  let totalCommitted = 0;
  let nodesWithStorage = 0;

  pnodes.forEach((pnode) => {
    const stats = pnode.stats as any;
    const committed = stats?.storage_committed ?? 0;
    if (committed > 0) {
      totalCommitted += committed;
      nodesWithStorage++;
    }
  });

  const TB_IN_BYTES = 1024 ** 4;
  const totalTB = totalCommitted / TB_IN_BYTES;

  console.log(`📊 Results (same calculation as frontend):`);
  console.log(`  Total nodes: ${pnodes.length}`);
  console.log(`  Nodes with storage_committed: ${nodesWithStorage}`);
  console.log(`  Total storage committed (raw): ${totalCommitted} bytes`);
  console.log(`  Total storage committed: ${totalTB.toFixed(2)} TB`);
  console.log(`\n💡 This is what the frontend SHOULD display.`);
  console.log(`   If you see 7.7 TB, try:`);
  console.log(`   1. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)`);
  console.log(`   2. Clear browser cache`);
  console.log(`   3. Restart dev server if running`);
}

testApiStorage();
