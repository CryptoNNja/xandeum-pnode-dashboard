import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.mjs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * GET /api/storage-history
 * Returns average storage committed per node for the last 7 days
 */
export async function GET() {
  try {
    // TODO: Implement actual historical data fetching from pnode_history table
    // For now, return empty history to prevent breaking the dashboard
    // The sparkline will simply not display until this is properly implemented
    
    console.log('📊 Storage history API called - returning empty (not yet implemented)');
    
    return NextResponse.json({ 
      history: [],
      message: 'Historical data not yet implemented - snapshots table does not exist'
    });

  } catch (error: any) {
    console.error('Storage history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
