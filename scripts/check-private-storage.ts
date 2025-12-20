import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env vars');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkPrivateNodes() {
  console.log('Fetching private (gossip_only) nodes...');
  const { data: nodes, error } = await supabase
    .from('pnodes')
    .select('ip, stats')
    .eq('status', 'gossip_only')
    .limit(20);

  if (error) {
    console.error(error);
    return;
  }

  if (!nodes || nodes.length === 0) {
    console.log('No private nodes found.');
    return;
  }

  console.log(`Found ${nodes.length} private nodes. Checking stats...`);
  
  // Print a few private IPs for reference
  console.log('Sample Private IPs:', nodes.slice(0, 5).map(n => n.ip).join(', '));

  let withStorage = 0;

  nodes.forEach(node => {
    const stats = node.stats as any;
    const fileSize = stats?.file_size;
    const storageCommitted = stats?.storage_committed;
    const totalBytes = stats?.total_bytes;

    if (fileSize > 0 || storageCommitted > 0 || totalBytes > 0) {
      console.log(`Node ${node.ip}:`);
      console.log(`  file_size: ${fileSize}`);
      console.log(`  storage_committed: ${storageCommitted}`);
      console.log(`  total_bytes: ${totalBytes}`);
      withStorage++;
    }
  });

  console.log(`
Total private nodes with any storage data: ${withStorage} / ${nodes.length}`);
}

checkPrivateNodes();
