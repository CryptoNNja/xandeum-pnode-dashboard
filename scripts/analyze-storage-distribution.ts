import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyzeStorageDistribution() {
  const { data: allNodes } = await supabase
    .from('pnodes')
    .select('ip, stats');

  if (!allNodes) return;

  const distribution: Record<string, number> = {};
  let totalCommitted = 0;
  let count = 0;

  allNodes.forEach((node) => {
    const stats = node.stats as any;
    const committed = stats?.storage_committed;

    if (committed) {
      const gb = Math.round(committed / (1024 ** 3));
      const key = `${gb} GB`;
      distribution[key] = (distribution[key] || 0) + 1;
      totalCommitted += committed;
      count++;
    }
  });

  console.log('📊 Storage Committed Distribution:\n');

  const sorted = Object.entries(distribution).sort((a, b) => {
    const aNum = parseInt(a[0]);
    const bNum = parseInt(b[0]);
    return bNum - aNum;
  });

  sorted.forEach(([size, nodeCount]) => {
    const percent = ((nodeCount / count) * 100).toFixed(1);
    console.log(`  ${size.padEnd(10)} : ${nodeCount.toString().padStart(3)} nodes (${percent}%)`);
  });

  console.log(`\n📈 Summary:`);
  console.log(`  Total nodes: ${count}`);
  console.log(`  Total committed: ${(totalCommitted / (1024 ** 4)).toFixed(2)} TB`);
  console.log(`  Average per node: ${(totalCommitted / count / (1024 ** 3)).toFixed(2)} GB`);
  console.log(`  Expected (official): 790 GB/node`);
  console.log(`  Difference: ${((790 - (totalCommitted / count / (1024 ** 3))) / 790 * 100).toFixed(1)}% less`);
}

analyzeStorageDistribution();
