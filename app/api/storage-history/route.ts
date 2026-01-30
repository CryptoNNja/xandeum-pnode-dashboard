import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * GET /api/storage-history
 * Returns average storage committed per node for the last 7 days
 * Data is fetched from network_snapshots table
 */
export async function GET() {
  try {
    // Fetch last 7 days of snapshots for storage trend
    const { data: snapshots, error } = await supabase
      .from('network_snapshots')
      .select('snapshot_date, total_storage_bytes, active_nodes, total_nodes')
      .order('snapshot_date', { ascending: false })
      .limit(7);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no data, return empty array
    if (!snapshots || snapshots.length === 0) {
      return NextResponse.json({
        history: [],
        hasData: false,
        message: 'No historical data available yet. Run save-daily-snapshot.ts to populate.'
      });
    }

    // Format data for the sparkline (reverse to show oldest to newest)
    const formattedHistory = snapshots.reverse().map(snapshot => {
      const totalNodes = snapshot.total_nodes || 1; // Avoid division by zero
      const avgCommittedPerNode = snapshot.total_storage_bytes / totalNodes;
      
      return {
        date: snapshot.snapshot_date,
        avgCommittedPerNode,
        totalNodes: snapshot.total_nodes,
        totalCommitted: snapshot.total_storage_bytes
      };
    });

    return NextResponse.json({
      history: formattedHistory,
      hasData: true,
      dataPoints: formattedHistory.length
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      history: [],
      hasData: false
    }, { status: 500 });
  }
}
