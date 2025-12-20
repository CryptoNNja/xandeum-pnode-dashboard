import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkMissingNode() {
  const missingIp = '159.69.221.189';
  const bootstrapIp = '192.190.136.36';

  console.log(`🔍 Checking why ${missingIp} doesn't have storage_committed...\n`);

  // 1. Check in database
  const { data: node } = await supabase
    .from('pnodes')
    .select('*')
    .eq('ip', missingIp)
    .single();

  if (node) {
    console.log(`📊 Node in database:`);
    console.log(`  IP: ${node.ip}`);
    console.log(`  Status: ${node.status}`);
    console.log(`  Version: ${node.version}`);
    console.log(`  Pubkey: ${node.pubkey}`);
    console.log(`  Stats:`, node.stats);
    console.log();
  }

  // 2. Check if it exists in get-pods-with-stats response
  console.log(`🔍 Checking get-pods-with-stats from ${bootstrapIp}...\n`);

  try {
    const response = await axios.post(
      `http://${bootstrapIp}:6000/rpc`,
      { jsonrpc: "2.0", method: "get-pods-with-stats", id: 1 },
      { timeout: 5000 }
    );

    const pods = response.data?.result?.pods || [];
    const foundPod = pods.find((pod: any) => {
      const ip = pod.address?.split(':')[0];
      return ip === missingIp;
    });

    if (foundPod) {
      console.log(`✅ Found in get-pods-with-stats:`);
      console.log(JSON.stringify(foundPod, null, 2));
    } else {
      console.log(`❌ NOT found in get-pods-with-stats response`);
      console.log(`   This means this node is not in the pods list`);
      console.log(`   It might be a bootstrap node or special case`);
    }
  } catch (error: any) {
    console.error('Error fetching pods:', error.message);
  }

  // 3. Try to call get-stats directly on the node
  console.log(`\n🔍 Trying to call get-stats directly on ${missingIp}...\n`);

  try {
    const response = await axios.post(
      `http://${missingIp}:6000/rpc`,
      { jsonrpc: "2.0", method: "get-stats", id: 1 },
      { timeout: 5000 }
    );

    console.log(`✅ get-stats response:`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error(`❌ Failed to call get-stats: ${error.message}`);
  }
}

checkMissingNode();
