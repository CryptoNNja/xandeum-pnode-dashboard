/**
 * Script to clean up duplicate nodes in the database
 * Keeps only one node per unique pubkey (the one with highest storage_committed)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface PNode {
  ip: string;
  pubkey: string | null;
  stats: any;
  status: string;
}

async function cleanupDuplicates() {
  console.log('🔍 Fetching all nodes from database...\n');
  
  const { data: pnodes, error } = await supabase
    .from('pnodes')
    .select('*');
  
  if (error || !pnodes) {
    console.error('❌ Error fetching nodes:', error);
    return;
  }
  
  console.log(`📊 Total nodes in DB: ${pnodes.length}\n`);
  
  // Find duplicates by pubkey
  const pubkeyGroups = new Map<string, PNode[]>();
  
  pnodes.forEach((node: PNode) => {
    const uniqueId = node.pubkey || node.ip;
    
    if (!pubkeyGroups.has(uniqueId)) {
      pubkeyGroups.set(uniqueId, []);
    }
    pubkeyGroups.get(uniqueId)!.push(node);
  });
  
  // Find which nodes to keep and which to delete
  const nodesToKeep: string[] = [];
  const nodesToDelete: string[] = [];
  let duplicateGroups = 0;
  
  console.log('🔍 Analyzing duplicates...\n');
  
  pubkeyGroups.forEach((nodes, uniqueId) => {
    if (nodes.length > 1) {
      duplicateGroups++;
      
      // Sort by storage_committed DESC, keep the first one
      const sorted = nodes.sort((a, b) => {
        const aCommitted = a.stats?.storage_committed ?? 0;
        const bCommitted = b.stats?.storage_committed ?? 0;
        return bCommitted - aCommitted;
      });
      
      const keeper = sorted[0];
      const duplicates = sorted.slice(1);
      
      nodesToKeep.push(keeper.ip);
      duplicates.forEach(dup => nodesToDelete.push(dup.ip));
      
      console.log(`📦 Pubkey/ID: ${uniqueId.substring(0, 20)}...`);
      console.log(`   ✅ Keeping: ${keeper.ip} (${(keeper.stats?.storage_committed / 1e12 || 0).toFixed(2)} TB)`);
      duplicates.forEach(dup => {
        console.log(`   ❌ Deleting: ${dup.ip} (${(dup.stats?.storage_committed / 1e12 || 0).toFixed(2)} TB)`);
      });
      console.log('');
    } else {
      nodesToKeep.push(nodes[0].ip);
    }
  });
  
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📊 SUMMARY:\n');
  console.log(`   Total nodes before:        ${pnodes.length}`);
  console.log(`   Unique nodes to keep:      ${nodesToKeep.length}`);
  console.log(`   Duplicate nodes to delete: ${nodesToDelete.length}`);
  console.log(`   Duplicate groups found:    ${duplicateGroups}\n`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (nodesToDelete.length === 0) {
    console.log('✅ No duplicates found! Database is already clean.\n');
    return;
  }
  
  // Confirm before deletion
  console.log('⚠️  WARNING: This will DELETE the duplicate nodes from the database!\n');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('🗑️  Deleting duplicate nodes...\n');
  
  // Delete in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < nodesToDelete.length; i += BATCH_SIZE) {
    const batch = nodesToDelete.slice(i, i + BATCH_SIZE);
    
    const { error: deleteError } = await supabase
      .from('pnodes')
      .delete()
      .in('ip', batch);
    
    if (deleteError) {
      console.error(`❌ Error deleting batch ${i / BATCH_SIZE + 1}:`, deleteError);
    } else {
      console.log(`   ✅ Deleted batch ${i / BATCH_SIZE + 1} (${batch.length} nodes)`);
    }
  }
  
  console.log('\n✅ Cleanup complete!\n');
  
  // Update network metadata
  console.log('📊 Updating network metadata...\n');
  
  const activeNodes = nodesToKeep.filter(ip => {
    const node = pnodes.find((n: PNode) => n.ip === ip);
    return node?.status === 'active';
  }).length;
  
  const { error: metadataError } = await supabase
    .from('network_metadata')
    .upsert({
      id: 1,
      network_total: nodesToKeep.length,
      crawled_nodes: nodesToKeep.length,
      active_nodes: activeNodes,
      last_updated: new Date().toISOString()
    }, { onConflict: 'id' });
  
  if (metadataError) {
    console.error('❌ Error updating metadata:', metadataError);
  } else {
    console.log('✅ Network metadata updated.\n');
  }
  
  console.log('🎉 All done! Your database is now clean.\n');
  console.log(`   Before: ${pnodes.length} nodes`);
  console.log(`   After:  ${nodesToKeep.length} nodes`);
  console.log(`   Removed: ${nodesToDelete.length} duplicates\n`);
}

cleanupDuplicates().catch(error => {
  console.error('❌ An error occurred:', error);
  process.exit(1);
});
