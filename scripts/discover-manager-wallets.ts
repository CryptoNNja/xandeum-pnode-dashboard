/**
 * Script to discover and update manager wallets for all nodes
 * 
 * Usage: npx tsx scripts/discover-manager-wallets.ts [--limit N] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { discoverManagerWallet } from '../lib/manager-discovery';

config({ path: '.env.local' });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse command line arguments
const args = process.argv.slice(2);
const limitArg = args.find(arg => arg.startsWith('--limit='));
const rawLimit = limitArg ? limitArg.split('=')[1] : undefined;
const limit = rawLimit !== undefined ? parseInt(rawLimit, 10) : undefined;

// Validate limit argument
if (rawLimit !== undefined && (!Number.isInteger(limit) || limit! <= 0)) {
  console.error('❌ Invalid --limit value. It must be a positive integer.');
  process.exit(1);
}

const dryRun = args.includes('--dry-run');

async function discoverAndUpdateManagerWallets() {
  console.log('🔍 Discovering Manager Wallets\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (dryRun) {
    console.log('🧪 DRY RUN MODE - No database updates will be made\n');
  }
  
  if (limit) {
    console.log(`📊 Limit: ${limit} nodes\n`);
  }
  
  // Fetch all nodes with pubkey but no manager_wallet
  console.log('📦 Fetching nodes from database...');
  
  let query = supabase
    .from('pnodes')
    .select('id, ip, pubkey, manager_wallet')
    .not('pubkey', 'is', null)
    .is('manager_wallet', null);
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data: nodes, error } = await query;
  
  if (error) {
    console.error('❌ Error fetching nodes:', error);
    process.exit(1);
  }
  
  if (!nodes || nodes.length === 0) {
    console.log('✅ All nodes already have manager_wallet set!');
    return;
  }
  
  console.log(`✅ Found ${nodes.length} nodes without manager_wallet\n`);
  
  // Discover manager wallets
  const results = {
    total: nodes.length,
    found: 0,
    notFound: 0,
    errors: 0,
    updated: 0,
  };
  
  console.log('🔍 Starting discovery...\n');
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const progress = `[${i + 1}/${nodes.length}]`;
    
    try {
      console.log(`${progress} ${node.pubkey?.slice(0, 8)}... (${node.ip || 'no IP'})`);
      
      const managerWallet = await discoverManagerWallet(node.pubkey!);
      
      if (managerWallet) {
        results.found++;
        console.log(`   ✅ Found: ${managerWallet.slice(0, 8)}...${managerWallet.slice(-8)}`);
        
        if (!dryRun) {
          // Update database
          const { error: updateError } = await supabase
            .from('pnodes')
            .update({ manager_wallet: managerWallet })
            .eq('id', node.id);
          
          if (updateError) {
            console.error(`   ❌ Update error:`, updateError.message);
            results.errors++;
          } else {
            results.updated++;
            console.log(`   💾 Updated in database`);
          }
        } else {
          console.log(`   🧪 Would update in database (dry run)`);
        }
      } else {
        results.notFound++;
        console.log(`   ⚠️  Not found`);
      }
      
      // Add delay to avoid rate limits
      if (i < nodes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
    } catch (error: any) {
      results.errors++;
      console.error(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 Summary\n');
  console.log(`   Total nodes processed: ${results.total}`);
  console.log(`   ✅ Manager wallets found: ${results.found}`);
  console.log(`   ⚠️  Not found: ${results.notFound}`);
  console.log(`   ❌ Errors: ${results.errors}`);
  
  if (!dryRun) {
    console.log(`   💾 Database updates: ${results.updated}`);
  } else {
    console.log(`   🧪 Dry run - no database updates made`);
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const successRate = ((results.found / results.total) * 100).toFixed(1);
  console.log(`✅ Success rate: ${successRate}%\n`);
  
  if (dryRun) {
    console.log('💡 Run without --dry-run to update the database\n');
  }
}

// Run the script
discoverAndUpdateManagerWallets()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
