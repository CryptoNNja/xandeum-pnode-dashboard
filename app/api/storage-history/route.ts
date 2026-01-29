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
    // Create admin client for server-side query
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Get snapshots from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: snapshots, error } = await supabase
      .from('network_snapshots')
      .select('snapshot_date, total_nodes, total_storage_committed')
      .gte('snapshot_date', sevenDaysAgo.toISOString())
      .order('snapshot_date', { ascending: true });

    if (error) {
      console.error('Error fetching storage history:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!snapshots || snapshots.length === 0) {
      return NextResponse.json({ 
        history: [],
        message: 'No historical data available'
      });
    }

    // Calculate avg committed per node for each day
    const history = snapshots.map(snapshot => ({
      date: snapshot.snapshot_date,
      avgCommittedPerNode: snapshot.total_nodes > 0 
        ? snapshot.total_storage_committed / snapshot.total_nodes 
        : 0,
      totalNodes: snapshot.total_nodes,
      totalCommitted: snapshot.total_storage_committed
    }));

    return NextResponse.json({ history });

  } catch (error: any) {
    console.error('Storage history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
