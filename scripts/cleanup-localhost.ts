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

async function cleanupLocalhost() {
  console.log('🧹 Cleaning up localhost node (127.0.0.1)...\n');

  // Check if the node exists first
  const { data: existing, error: checkError } = await supabaseAdmin
    .from('pnodes')
    .select('ip, version, status')
    .eq('ip', '127.0.0.1')
    .single();

  if (checkError) {
    if (checkError.code === 'PGRST116') {
      console.log('✅ No localhost node found in database. Already clean!');
      process.exit(0);
    }
    console.error('Error checking for localhost node:', checkError);
    process.exit(1);
  }

  if (existing) {
    console.log('Found localhost node:');
    console.log(`  IP: ${existing.ip}`);
    console.log(`  Version: ${existing.version}`);
    console.log(`  Status: ${existing.status}`);
    console.log('');
  }

  // Delete the node
  const { error: deleteError } = await supabaseAdmin
    .from('pnodes')
    .delete()
    .eq('ip', '127.0.0.1');

  if (deleteError) {
    console.error('❌ Error deleting localhost node:', deleteError);
    process.exit(1);
  }

  console.log('✅ Successfully deleted localhost node (127.0.0.1)');

  // Also clean up any history records for this IP
  const { error: historyError } = await supabaseAdmin
    .from('pnode_history')
    .delete()
    .eq('ip', '127.0.0.1');

  if (historyError) {
    console.warn('⚠️  Warning: Could not delete history records:', historyError.message);
  } else {
    console.log('✅ Also cleaned up history records for 127.0.0.1');
  }

  console.log('\n✨ Cleanup complete!');
}

cleanupLocalhost().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});
