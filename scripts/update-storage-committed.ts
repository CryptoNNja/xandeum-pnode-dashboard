import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateStorageCommitted() {
  const bootstrapIp = '192.190.136.36';

  console.log(`🔍 Fetching pods from ${bootstrapIp}...\n`);

  // Get all pods from network
  const response = await axios.post(
    `http://${bootstrapIp}:6000/rpc`,
    { jsonrpc: "2.0", method: "get-pods-with-stats", id: 1 },
    { timeout: 5000 }
  );

  const pods = response.data?.result?.pods || [];
  console.log(`Found ${pods.length} pods\n`);

  // Build map of IP -> storage_committed
  const storageMap = new Map<string, number>();
  pods.forEach((pod: any) => {
    const ip = pod.address?.split(':')[0];
    const storage = pod.storage_committed || 0;
    if (ip && storage > 0) {
      storageMap.set(ip, storage);
    }
  });

  console.log(`Built storage map for ${storageMap.size} nodes\n`);

  // Get all nodes from database
  const { data: nodes } = await supabase
    .from('pnodes')
    .select('ip, stats');

  if (!nodes) {
    console.error('No nodes found in database');
    return;
  }

  console.log(`Found ${nodes.length} nodes in database\n`);

  // Update each node's stats with storage_committed
  let updated = 0;
  for (const node of nodes) {
    const storageCommitted = storageMap.get(node.ip);
    if (storageCommitted) {
      const stats = node.stats as any || {};
      stats.storage_committed = storageCommitted;

      await supabase
        .from('pnodes')
        .update({ stats })
        .eq('ip', node.ip);

      updated++;

      if (updated <= 5) {
        console.log(`✅ Updated ${node.ip}: ${(storageCommitted / (1024 ** 3)).toFixed(2)} GB`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Updated ${updated} nodes with storage_committed values`);

  // Calculate total
  let total = 0;
  storageMap.forEach(storage => total += storage);
  console.log(`  Total storage: ${(total / (1024 ** 4)).toFixed(2)} TB`);
  console.log(`  Average: ${(total / storageMap.size / (1024 ** 3)).toFixed(2)} GB/node`);
}

updateStorageCommitted();
