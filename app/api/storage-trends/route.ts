import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * GET /api/storage-history
 * Returns average storage committed per node for the last 6 crawler runs (real-time snapshots)
 * Each data point represents one crawler execution, updated every 30 minutes
 */
export async function GET() {
  try {
    // Get distinct crawler timestamps (one per crawl)
    const { data: timestamps, error: tsError } = await supabase
      .from('pnode_history')
      .select('ts')
      .order('ts', { ascending: false })
      .limit(6 * 400); // Get enough records to cover 6 crawls (assuming ~400 nodes per crawl)

    if (tsError) {
      console.error('Supabase error fetching timestamps:', tsError);
      return NextResponse.json({ error: tsError.message }, { status: 500 });
    }

    if (!timestamps || timestamps.length === 0) {
      return NextResponse.json({
        history: [],
        hasData: false,
        message: 'No historical data available yet. Crawler needs to run to populate data.'
      });
    }

    // Get unique timestamps (one per crawler run)
    const uniqueTimestampsSet = new Set(timestamps.map(t => t.ts));
    const uniqueTimestamps = Array.from(uniqueTimestampsSet)
      .sort((a, b) => b - a) // Sort descending (most recent first)
      .slice(0, 6); // Take last 6 crawls

    if (uniqueTimestamps.length === 0) {
      return NextResponse.json({
        history: [],
        hasData: false,
        message: 'No crawler runs found yet.'
      });
    }

    // Fetch all records for these timestamps
    const { data: historyRecords, error } = await supabase
      .from('pnode_history')
      .select('ip, storage_committed, ts')
      .in('ts', uniqueTimestamps)
      .order('ts', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no data, return empty array
    if (!historyRecords || historyRecords.length === 0) {
      return NextResponse.json({
        history: [],
        hasData: false,
        message: 'No historical data available yet. Crawler needs to run to populate data.'
      });
    }

    // Group records by crawler timestamp (ts)
    const crawlSnapshots = new Map<number, Array<{ ip: string; storage_committed: number }>>();

    for (const record of historyRecords) {
      const ts = record.ts;
      const storageCommitted = record.storage_committed || 0;
      
      if (!crawlSnapshots.has(ts)) {
        crawlSnapshots.set(ts, []);
      }
      
      crawlSnapshots.get(ts)!.push({
        ip: record.ip,
        storage_committed: storageCommitted
      });
    }

    // Calculate average storage per node for each crawler snapshot
    const formattedHistory = Array.from(crawlSnapshots.entries())
      .map(([ts, records]) => {
        // Get unique IPs for this crawl
        const uniqueNodes = new Map<string, number>();
        for (const record of records) {
          uniqueNodes.set(record.ip, record.storage_committed);
        }

        const totalStorage = Array.from(uniqueNodes.values()).reduce((sum, val) => sum + val, 0);
        const nodeCount = uniqueNodes.size;
        const avgCommittedPerNode = nodeCount > 0 ? totalStorage / nodeCount : 0;

        return {
          date: new Date(ts * 1000).toISOString(),
          avgCommittedPerNode,
          totalNodes: nodeCount,
          totalCommitted: totalStorage
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Already limited to 6 crawls by the query
    const limitedHistory = formattedHistory;

    return NextResponse.json({
      history: limitedHistory,
      hasData: limitedHistory.length >= 2,
      dataPoints: limitedHistory.length,
      timeRange: 'last_6_crawls',
      interval: 'per_crawl'
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' // 2 min cache for real-time updates
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
