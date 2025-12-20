import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkPrivateNodesStorage() {
  console.log('🔍 Analyzing storage_committed across node types...\n');

  const { data: nodes } = await supabase
    .from('pnodes')
    .select('ip, status, stats');

  if (!nodes) {
    console.error('No nodes found');
    return;
  }

  // Categorize nodes
  const withStorage: any[] = [];
  const withoutStorage: any[] = [];
  const gossipOnly: any[] = [];
  const active: any[] = [];

  nodes.forEach(node => {
    const stats = node.stats as any;
    const hasStorage = stats?.storage_committed && stats.storage_committed > 0;

    if (hasStorage) {
      withStorage.push(node);
    } else {
      withoutStorage.push(node);
    }

    if (node.status === 'gossip_only') {
      gossipOnly.push(node);
    } else {
      active.push(node);
    }
  });

  console.log(`📊 Storage availability by node type:\n`);
  console.log(`Total nodes: ${nodes.length}`);
  console.log(`  - With storage_committed: ${withStorage.length}`);
  console.log(`  - Without storage_committed: ${withoutStorage.length}\n`);

  console.log(`Node status breakdown:`);
  console.log(`  - Active nodes: ${active.length}`);
  console.log(`  - Gossip-only nodes: ${gossipOnly.length}\n`);

  // Check if nodes without storage are gossip_only
  const gossipWithoutStorage = withoutStorage.filter(n => n.status === 'gossip_only');
  const activeWithoutStorage = withoutStorage.filter(n => n.status === 'active');

  console.log(`Nodes WITHOUT storage_committed:`);
  console.log(`  - Gossip-only: ${gossipWithoutStorage.length}`);
  console.log(`  - Active: ${activeWithoutStorage.length}\n`);

  if (withoutStorage.length > 0) {
    console.log(`❌ Nodes missing storage_committed (first 10):`);
    withoutStorage.slice(0, 10).forEach(node => {
      console.log(`  ${node.ip} (${node.status})`);
    });
    console.log();
  }

  // Check gossip_only nodes WITH storage
  const gossipWithStorage = gossipOnly.filter(n => {
    const stats = n.stats as any;
    return stats?.storage_committed && stats.storage_committed > 0;
  });

  console.log(`✅ Gossip-only nodes WITH storage_committed: ${gossipWithStorage.length}`);
  if (gossipWithStorage.length > 0) {
    console.log(`   Examples (first 5):`);
    gossipWithStorage.slice(0, 5).forEach(node => {
      const stats = node.stats as any;
      const storageGB = (stats.storage_committed / (1024 ** 3)).toFixed(2);
      console.log(`   ${node.ip}: ${storageGB} GB`);
    });
  }
}

checkPrivateNodesStorage();
