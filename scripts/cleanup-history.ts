/**
 * Cleanup script for pnode_history table
 * 
 * Deletes records older than 30 days to prevent table explosion.
 * Should be run daily via GitHub Actions (see .github/workflows/cleanup-history.yml)
 * 
 * Usage:
 *   npm run cleanup-history
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL:', !!SUPABASE_URL);
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

async function cleanup() {
    console.log('🧹 Starting pnode_history cleanup...');
    console.log('   Retention policy: 30 days');
    console.log('   Timestamp:', new Date().toISOString());
    
    try {
        // Call the cleanup function
        const { data, error } = await supabase.rpc('cleanup_old_history');
        
        if (error) {
            console.error('❌ Cleanup failed:', error.message);
            process.exit(1);
        }
        
        const deletedCount = data?.[0]?.deleted_count || 0;
        
        console.log(`✅ Cleanup complete!`);
        console.log(`   Deleted records: ${deletedCount.toLocaleString()}`);
        
        if (deletedCount === 0) {
            console.log('   ℹ️  No records older than 30 days found (all good!)');
        } else {
            console.log(`   💾 Freed up space from ${deletedCount} old records`);
        }
        
    } catch (err: any) {
        console.error('❌ Unexpected error:', err.message);
        process.exit(1);
    }
}

// Run cleanup
cleanup();
