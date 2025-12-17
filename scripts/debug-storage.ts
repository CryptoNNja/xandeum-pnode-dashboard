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

const TB_IN_BYTES = 1024 ** 4;
const GB_IN_BYTES = 1024 ** 3;
const MB_IN_BYTES = 1024 ** 2;

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  if (bytes >= TB_IN_BYTES) {
    const tb = bytes / TB_IN_BYTES;
    return `${tb.toFixed(2)} TB`;
  }
  if (bytes >= GB_IN_BYTES) {
    const gb = bytes / GB_IN_BYTES;
    return `${gb.toFixed(2)} GB`;
  }
  if (bytes >= MB_IN_BYTES) {
    const mb = bytes / MB_IN_BYTES;
    return `${mb.toFixed(2)} MB`;
  }
  return `${bytes.toFixed(0)} B`;
};

async function debugStorage() {
  console.log('🔍 Analyzing storage data for ALL nodes (active + private)...\n');

  const { data: pnodes, error } = await supabaseAdmin
    .from('pnodes')
    .select('ip, status, stats');

  if (error) {
    console.error('Error fetching pnodes:', error);
    process.exit(1);
  }

  if (!pnodes || pnodes.length === 0) {
    console.log('No pnodes found in database.');
    process.exit(0);
  }

  // Separate nodes by status
  const activeNodes = pnodes.filter(node => node.status === 'active');
  const privateNodes = pnodes.filter(node => node.status === 'gossip_only');

  // Analyze ACTIVE nodes
  let activeCommitted = 0;
  let activeUsed = 0;
  const activeNodesWithStorage: Array<{ ip: string; status: string; committed: number; used: number; percent: number }> = [];

  activeNodes.forEach((node) => {
    const stats = node.stats as any;
    const committed = stats?.file_size ?? 0;
    const used = stats?.total_bytes ?? 0;

    if (committed > 0 || used > 0) {
      const percent = committed > 0 ? (used / committed) * 100 : 0;
      activeNodesWithStorage.push({
        ip: node.ip,
        status: node.status,
        committed,
        used,
        percent,
      });
    }

    activeCommitted += Number.isFinite(committed) ? committed : 0;
    activeUsed += Number.isFinite(used) ? used : 0;
  });

  // Analyze PRIVATE nodes
  let privateCommitted = 0;
  let privateUsed = 0;
  const privateNodesWithStorage: Array<{ ip: string; status: string; committed: number; used: number; percent: number }> = [];

  privateNodes.forEach((node) => {
    const stats = node.stats as any;
    const committed = stats?.file_size ?? 0;
    const used = stats?.total_bytes ?? 0;

    if (committed > 0 || used > 0) {
      const percent = committed > 0 ? (used / committed) * 100 : 0;
      privateNodesWithStorage.push({
        ip: node.ip,
        status: node.status,
        committed,
        used,
        percent,
      });
    }

    privateCommitted += Number.isFinite(committed) ? committed : 0;
    privateUsed += Number.isFinite(used) ? used : 0;
  });

  // Combined totals
  const totalCommitted = activeCommitted + privateCommitted;
  const totalUsed = activeUsed + privateUsed;

  // Print ACTIVE nodes summary
  console.log('📊 Storage Summary - ACTIVE NODES:');
  console.log(`  Active nodes:        ${activeNodes.length}`);
  console.log(`  Nodes with storage:  ${activeNodesWithStorage.length}`);
  console.log(`  Total committed:     ${formatBytes(activeCommitted)} (${activeCommitted.toLocaleString()} bytes)`);
  console.log(`  Total used:          ${formatBytes(activeUsed)} (${activeUsed.toLocaleString()} bytes)`);
  console.log(`  Overall utilization: ${activeCommitted > 0 ? ((activeUsed / activeCommitted) * 100).toFixed(2) : 0}%`);
  console.log('');

  // Print PRIVATE nodes summary
  console.log('📊 Storage Summary - PRIVATE NODES:');
  console.log(`  Private nodes:       ${privateNodes.length}`);
  console.log(`  Nodes with storage:  ${privateNodesWithStorage.length}`);
  if (privateNodesWithStorage.length > 0) {
    console.log(`  Total committed:     ${formatBytes(privateCommitted)} (${privateCommitted.toLocaleString()} bytes)`);
    console.log(`  Total used:          ${formatBytes(privateUsed)} (${privateUsed.toLocaleString()} bytes)`);
    console.log(`  Overall utilization: ${privateCommitted > 0 ? ((privateUsed / privateCommitted) * 100).toFixed(2) : 0}%`);
  } else {
    console.log(`  ⚠️  No storage data found in private nodes`);
  }
  console.log('');

  // Print COMBINED summary
  console.log('📊 Storage Summary - ALL NODES (if including private):');
  console.log(`  Total nodes:         ${pnodes.length}`);
  console.log(`  Nodes with storage:  ${activeNodesWithStorage.length + privateNodesWithStorage.length}`);
  console.log(`  Total committed:     ${formatBytes(totalCommitted)} (${totalCommitted.toLocaleString()} bytes)`);
  console.log(`  Total used:          ${formatBytes(totalUsed)} (${totalUsed.toLocaleString()} bytes)`);
  console.log(`  Overall utilization: ${totalCommitted > 0 ? ((totalUsed / totalCommitted) * 100).toFixed(2) : 0}%`);
  console.log('');

  // Show top nodes from both categories
  const allNodesWithStorage = [...activeNodesWithStorage, ...privateNodesWithStorage];
  if (allNodesWithStorage.length > 0) {
    console.log('📈 Top 15 nodes by storage commitment (all statuses):\n');
    allNodesWithStorage
      .sort((a, b) => b.committed - a.committed)
      .slice(0, 15)
      .forEach((node, index) => {
        const statusLabel = node.status === 'active' ? 'ACTIVE' : 'PRIVATE';
        console.log(`  ${(index + 1).toString().padStart(2)}. ${node.ip} [${statusLabel}]`);
        console.log(`      Committed: ${formatBytes(node.committed)}`);
        console.log(`      Used:      ${formatBytes(node.used)}`);
        console.log(`      Util:      ${node.percent.toFixed(2)}%`);
        console.log('');
      });
  } else {
    console.log('⚠️  No nodes with storage data found!');
  }

  // Check for data anomalies
  console.log('🔍 Checking for anomalies...\n');

  // Active nodes anomalies
  const activeNodesWithNoCommit = activeNodes.filter((node) => {
    const stats = node.stats as any;
    return !stats?.file_size || stats.file_size === 0;
  });

  if (activeNodesWithNoCommit.length > 0) {
    console.log(`⚠️  Found ${activeNodesWithNoCommit.length} active nodes with file_size = 0 or missing`);
    console.log('   Sample IPs:', activeNodesWithNoCommit.slice(0, 5).map(n => n.ip).join(', '));
    console.log('');
  }

  const activeNodesWithUsedButNoCommit = activeNodes.filter((node) => {
    const stats = node.stats as any;
    const committed = stats?.file_size ?? 0;
    const used = stats?.total_bytes ?? 0;
    return used > 0 && committed === 0;
  });

  if (activeNodesWithUsedButNoCommit.length > 0) {
    console.log(`⚠️  Found ${activeNodesWithUsedButNoCommit.length} active nodes with total_bytes > 0 but file_size = 0 (impossible!)`);
    console.log('   Sample IPs:', activeNodesWithUsedButNoCommit.slice(0, 5).map(n => n.ip).join(', '));
    console.log('');
  }

  // Private nodes anomalies
  const privateNodesWithStorageData = privateNodes.filter((node) => {
    const stats = node.stats as any;
    const committed = stats?.file_size ?? 0;
    const used = stats?.total_bytes ?? 0;
    return committed > 0 || used > 0;
  });

  if (privateNodesWithStorageData.length > 0) {
    console.log(`ℹ️  Found ${privateNodesWithStorageData.length} private nodes with storage data`);
    console.log('   This suggests private nodes DO have storage metrics.');
    console.log('   Recommendation: Include private nodes in storage capacity calculation.');
    console.log('   Sample IPs:', privateNodesWithStorageData.slice(0, 5).map(n => n.ip).join(', '));
    console.log('');
  } else {
    console.log(`ℹ️  No private nodes have storage data`);
    console.log('   Recommendation: Keep current behavior (exclude private nodes from storage calculation).');
    console.log('');
  }

  const privateNodesWithUsedButNoCommit = privateNodes.filter((node) => {
    const stats = node.stats as any;
    const committed = stats?.file_size ?? 0;
    const used = stats?.total_bytes ?? 0;
    return used > 0 && committed === 0;
  });

  if (privateNodesWithUsedButNoCommit.length > 0) {
    console.log(`⚠️  Found ${privateNodesWithUsedButNoCommit.length} private nodes with total_bytes > 0 but file_size = 0 (inconsistent!)`);
    console.log('   Sample IPs:', privateNodesWithUsedButNoCommit.slice(0, 5).map(n => n.ip).join(', '));
    console.log('');
  }

  // Final recommendation
  console.log('💡 RECOMMENDATION:');
  if (privateNodesWithStorageData.length > 0 && privateCommitted > 0) {
    const impactPercent = ((privateCommitted / totalCommitted) * 100).toFixed(1);
    console.log(`   Private nodes represent ${impactPercent}% of total committed storage.`);
    console.log(`   → Should INCLUDE private nodes in storage capacity KPI calculation.`);
  } else {
    console.log(`   Private nodes have no meaningful storage data.`);
    console.log(`   → Can EXCLUDE private nodes from storage capacity KPI calculation.`);
  }

  console.log('\n✨ Analysis complete.');
}

debugStorage().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});
