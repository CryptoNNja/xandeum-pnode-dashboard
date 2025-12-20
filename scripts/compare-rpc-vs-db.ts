import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function compareRpcVsDb() {
  const testIp = '192.190.136.36';

  // 1. Get fresh data from RPC
  console.log('🔍 Fetching from RPC...\n');
  const response = await axios.post(
    `http://${testIp}:6000/rpc`,
    { jsonrpc: "2.0", method: "get-pods-with-stats", id: 1 },
    { timeout: 5000 }
  );

  const pods = response.data?.result?.pods || [];
  console.log(`Found ${pods.length} pods from RPC\n`);

  // Build map of IP -> storage_committed from RPC
  const rpcMap = new Map<string, number>();
  pods.forEach((pod: any) => {
    const ip = pod.address?.split(':')[0];
    const storage = pod.storage_committed || 0;
    if (ip && storage > 0) {
      rpcMap.set(ip, storage);
    }
  });

  // 2. Get data from database
  console.log('🔍 Fetching from database...\n');
  const { data: nodes } = await supabase
    .from('pnodes')
    .select('ip, stats');

  if (!nodes) {
    console.error('No nodes found in database');
    return;
  }

  console.log(`Found ${nodes.length} nodes in database\n`);

  // Compare first 10 nodes
  console.log('📊 Comparison (first 10 with differences):\n');
  let compared = 0;
  let matches = 0;
  let mismatches = 0;

  for (const node of nodes) {
    if (compared >= 10) break;

    const ip = node.ip;
    const dbStorage = (node.stats as any)?.storage_committed;
    const rpcStorage = rpcMap.get(ip);

    if (rpcStorage) {
      compared++;
      const match = dbStorage === rpcStorage;

      if (match) {
        matches++;
      } else {
        mismatches++;
        console.log(`IP: ${ip}`);
        console.log(`  RPC:      ${rpcStorage} bytes = ${(rpcStorage / (1024 ** 3)).toFixed(2)} GB`);
        console.log(`  Database: ${dbStorage} bytes = ${(dbStorage / (1024 ** 3)).toFixed(2)} GB`);
        console.log(`  Match: ${match ? '✅' : '❌'}\n`);
      }
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`  Compared: ${compared} nodes`);
  console.log(`  Matches: ${matches}`);
  console.log(`  Mismatches: ${mismatches}`);
}

compareRpcVsDb();
