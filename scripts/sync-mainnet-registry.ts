/**
 * Sync Mainnet Registry
 * 
 * Synchronizes official Xandeum mainnet registry nodes into the database.
 * - Inserts new registry-only nodes (pubkey without IP)
 * - Updates existing nodes to mark them as official
 * - Maintains source tracking (crawler vs registry vs both)
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabase } from '../lib/supabase';
import { getMainnetRegistry } from '../lib/mainnet-registry';

interface SyncStats {
  totalRegistry: number;
  newRegistryOnly: number;
  markedAsOfficial: number;
  errors: number;
}

async function syncMainnetRegistry(): Promise<SyncStats> {
  const stats: SyncStats = {
    totalRegistry: 0,
    newRegistryOnly: 0,
    markedAsOfficial: 0,
    errors: 0
  };

  try {
    console.log('🔄 Fetching official mainnet registry...');
    const registry = getMainnetRegistry();
    await registry.refreshMainnetList();
    const officialPubkeys = registry.getMainnetPubkeys();
    
    stats.totalRegistry = officialPubkeys.length;
    console.log(`✅ Found ${stats.totalRegistry} official mainnet nodes`);

    for (const pubkey of officialPubkeys) {
      try {
        // Check if node already exists in database
        const { data: existing, error: fetchError } = await supabase
          .from('pnodes')
          .select('*')
          .eq('pubkey', pubkey)
          .maybeSingle();

        if (fetchError) {
          console.error(`❌ Error fetching node ${pubkey}:`, fetchError);
          stats.errors++;
          continue;
        }

        if (existing) {
          // Node already exists (discovered by crawler)
          // Mark as official and update source to 'both'
          const { error: updateError } = await supabase
            .from('pnodes')
            .update({
              source: 'both',
              network: 'MAINNET',
              network_confidence: 'high',
              is_official: true
            } as any)
            .eq('pubkey', pubkey);

          if (updateError) {
            console.error(`❌ Error updating node ${pubkey}:`, updateError);
            stats.errors++;
          } else {
            console.log(`✓ Marked existing node as official: ${pubkey.slice(0, 8)}...`);
            stats.markedAsOfficial++;
          }
        } else {
          // Node not yet discovered - insert as registry-only
          const { error: insertError } = await supabase
            .from('pnodes')
            .insert({
              pubkey,
              ip: null,
              status: 'registry_only',
              source: 'registry',
              network: 'MAINNET',
              network_confidence: 'high',
              is_official: true,
              stats: {},
              version: 'unknown'
            } as any);

          if (insertError) {
            // Handle duplicate key error (race condition)
            if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
              console.log(`⚠️ Node ${pubkey.slice(0, 8)}... already exists (race condition)`);
            } else {
              console.error(`❌ Error inserting node ${pubkey}:`, insertError);
              stats.errors++;
            }
          } else {
            console.log(`✓ Inserted registry-only node: ${pubkey.slice(0, 8)}...`);
            stats.newRegistryOnly++;
          }
        }
      } catch (err) {
        console.error(`❌ Unexpected error processing ${pubkey}:`, err);
        stats.errors++;
      }
    }

    // Summary
    console.log('\n📊 Sync Summary:');
    console.log(`   Total registry nodes: ${stats.totalRegistry}`);
    console.log(`   New registry-only: ${stats.newRegistryOnly}`);
    console.log(`   Marked as official: ${stats.markedAsOfficial}`);
    console.log(`   Errors: ${stats.errors}`);

    return stats;
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  syncMainnetRegistry()
    .then((stats) => {
      if (stats.errors > 0) {
        console.error(`\n⚠️ Completed with ${stats.errors} errors`);
        process.exit(1);
      } else {
        console.log('\n✅ Sync completed successfully');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('\n💥 Sync failed:', error);
      process.exit(1);
    });
}

export { syncMainnetRegistry };
