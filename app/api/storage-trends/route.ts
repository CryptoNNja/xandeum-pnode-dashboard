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
    // Strategy: Use PostgreSQL to get distinct timestamps efficiently
    // We'll use rpc to execute a custom SQL query that gets the last 6 distinct timestamps
    const { data: distinctTimestamps, error: tsError } = await supabase.rpc('get_last_n_crawl_timestamps', { n: 6 });


    // Fallback: If RPC doesn't exist, use the old approach but fetch MORE records
    let uniqueTimestamps: number[];
    
    if (tsError || !distinctTimestamps) {
      console.log('[storage-trends] RPC not available, using fallback method...', tsError?.message);
      
      // Fetch enough records to ensure we capture 6 distinct timestamps
      // Analysis shows we need ~2000 records to get 6 distinct crawls
      // Using 3000 with safety margin to account for varying node counts over time
      const { data: timestamps, error: fallbackError } = await supabase
        .from('pnode_history')
        .select('ts')
        .order('ts', { ascending: false })
        .limit(3000); // Empirically determined: 2000 needed, 3000 for safety margin

      if (fallbackError) {
        console.error('Supabase error fetching timestamps:', fallbackError);
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
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
      uniqueTimestamps = Array.from(uniqueTimestampsSet)
        .sort((a, b) => b - a) // Sort descending (most recent first)
        .slice(0, 6); // Take last 6 crawls
    } else {
      uniqueTimestamps = distinctTimestamps.map((item: any) => item.ts);
    }

    if (uniqueTimestamps.length === 0) {
      return NextResponse.json({
        history: [],
        hasData: false,
        message: 'No crawler runs found yet.'
      });
    }

    // Fetch all records for these timestamps
    // Supabase has a hard limit of 1000 records per query, so we need to paginate
    // With ~400 nodes per crawl × 6 crawls = ~2400 records needed
    let historyRecords: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore && page < 10) { // Safety limit: max 10 pages = 10k records
      const { data, error } = await supabase
        .from('pnode_history')
        .select('ip, storage_committed, ts')
        .in('ts', uniqueTimestamps)
        .order('ts', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        historyRecords = historyRecords.concat(data);
        if (data.length < pageSize) {
          hasMore = false; // Last page
        }
        page++;
      }
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
