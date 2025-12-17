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

async function debugHistoryRange() {
  console.log('🔍 Analyzing pnode_history date range...\n');

  const { data: allRecords, error } = await supabaseAdmin
    .from('pnode_history')
    .select('ts')
    .order('ts', { ascending: true })
    .limit(10000);

  if (error) {
    console.error('Error fetching history:', error);
    process.exit(1);
  }

  if (!allRecords || allRecords.length === 0) {
    console.log('⚠️  No pnode_history records found in database.');
    console.log('   → This explains why /api/network-health/last-week returns null.');
    process.exit(0);
  }

  const timestamps = allRecords.map(r => r.ts as number).sort((a, b) => a - b);
  const oldest = timestamps[0];
  const newest = timestamps[timestamps.length - 1];
  const now = Math.floor(Date.now() / 1000);

  const oldestDate = new Date(oldest * 1000);
  const newestDate = new Date(newest * 1000);
  const daysAgoOldest = Math.floor((now - oldest) / 86400);
  const daysAgoNewest = Math.floor((now - newest) / 86400);

  console.log('📊 History Range Summary:');
  console.log(`  Total records:     ${allRecords.length}`);
  console.log(`  Oldest record:     ${oldestDate.toISOString()} (${daysAgoOldest} days ago)`);
  console.log(`  Newest record:     ${newestDate.toISOString()} (${daysAgoNewest} days ago)`);
  console.log(`  Date range span:   ${Math.ceil((newest - oldest) / 86400)} days`);
  console.log('');

  // Check if we have data for 7 days ago
  const sevenDaysAgo = now - (7 * 86400);
  const records7DaysAgo = timestamps.filter(ts => {
    const diff = Math.abs(ts - sevenDaysAgo);
    return diff < (2 * 86400); // Within 2 days of 7 days ago
  });

  if (records7DaysAgo.length > 0) {
    console.log(`✅ Found ${records7DaysAgo.length} records around 7 days ago`);
    console.log(`   → /api/network-health/last-week should work!`);
  } else {
    console.log(`⚠️  No records found around 7 days ago`);
    console.log(`   → /api/network-health/last-week will return null`);
    console.log(`   → You need at least ${7 - daysAgoOldest} more days of history`);
  }

  // Show distribution by day
  console.log('\n📅 Records per day (last 10 days):');
  const dayCounts = new Map<number, number>();
  timestamps.forEach(ts => {
    const daysAgo = Math.floor((now - ts) / 86400);
    dayCounts.set(daysAgo, (dayCounts.get(daysAgo) || 0) + 1);
  });

  Array.from(dayCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(0, 10)
    .forEach(([daysAgo, count]) => {
      const date = new Date((now - daysAgo * 86400) * 1000);
      console.log(`  ${daysAgo}d ago (${date.toISOString().split('T')[0]}): ${count} records`);
    });

  console.log('\n✨ Analysis complete.');
}

debugHistoryRange().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});

