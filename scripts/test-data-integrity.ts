import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: './.env.local' });
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function testDataIntegrity() {
  console.log('🔍 Testing data integrity...\n');

  const { data: pnodes, error } = await supabaseAdmin
    .from('pnodes')
    .select('ip, status');

  if (error) {
    console.error('Error fetching pnodes:', error);
    process.exit(1);
  }

  if (!pnodes || pnodes.length === 0) {
    console.log('No pnodes found in database.');
    process.exit(0);
  }

  const totalNodes = pnodes.length;
  const publicCount = pnodes.filter((node) => node.status === 'active').length;
  const privateCount = pnodes.filter((node) => node.status === 'gossip_only').length;
  const sumCounts = publicCount + privateCount;

  console.log('📊 Node counts:');
  console.log(`  Total nodes:   ${totalNodes}`);
  console.log(`  Public nodes:  ${publicCount} (active)`);
  console.log(`  Private nodes: ${privateCount} (gossip_only)`);
  console.log(`  Sum:           ${sumCounts}`);
  console.log('');

  if (sumCounts === totalNodes) {
    console.log('✅ Data integrity: VALID');
    console.log('   Public + Private = Total ✓');
  } else {
    const discrepancy = totalNodes - sumCounts;
    console.log('❌ Data integrity: INVALID');
    console.log(`   Discrepancy: ${discrepancy > 0 ? '+' : ''}${discrepancy}`);
    console.log('');

    // Find nodes with unexpected status
    const unexpectedNodes = pnodes.filter(
      (node) => node.status !== 'active' && node.status !== 'gossip_only'
    );

    if (unexpectedNodes.length > 0) {
      console.log(`⚠️  Found ${unexpectedNodes.length} node(s) with unexpected status:\n`);
      unexpectedNodes.forEach((node) => {
        console.log(`   ${node.ip} → status: "${node.status}"`);
      });
    } else {
      console.log('⚠️  No unexpected status found, but counts still don\'t match.');
      console.log('   This might indicate a logic error in counting.');
    }
  }

  // Show status distribution
  const statusCounts = new Map<string, number>();
  pnodes.forEach((node) => {
    const status = node.status || 'null';
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  });

  console.log('\n📈 Status distribution:');
  Array.from(statusCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      console.log(`   ${status.padEnd(15)} → ${count} nodes`);
    });

  console.log('\n✨ Test complete.');
}

testDataIntegrity().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});
