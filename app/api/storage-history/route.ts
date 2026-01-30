import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * GET /api/storage-history
 * Returns average storage committed per node over the last 24 hours (semi-real-time)
 * Data is aggregated from pnode_history table at 30-minute intervals
 */
export async function GET() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const twentyFourHoursAgo = now - (24 * 3600);

    // Fetch pnode_history records from the last 24 hours
    const { data: historyRecords, error } = await supabase
      .from('pnode_history')
      .select('ip, stats, recorded_at')
      .gte('recorded_at', new Date(twentyFourHoursAgo * 1000).toISOString())
      .order('recorded_at', { ascending: true });

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

    // Group records by 30-minute time buckets
    const bucketSize = 30 * 60 * 1000; // 30 minutes in milliseconds
    const buckets = new Map<number, Array<{ ip: string; storage_committed: number }>>();

    for (const record of historyRecords) {
      const timestamp = new Date(record.recorded_at).getTime();
      const bucketKey = Math.floor(timestamp / bucketSize) * bucketSize;
      
      const storageCommitted = record.stats?.storage_committed || 0;
      
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      
      buckets.get(bucketKey)!.push({
        ip: record.ip,
        storage_committed: storageCommitted
      });
    }

    // Calculate average storage per node for each bucket
    const formattedHistory = Array.from(buckets.entries())
      .map(([bucketKey, records]) => {
        // Get unique IPs (latest record per IP in this bucket)
        const latestByIp = new Map<string, number>();
        for (const record of records) {
          latestByIp.set(record.ip, record.storage_committed);
        }

        const totalStorage = Array.from(latestByIp.values()).reduce((sum, val) => sum + val, 0);
        const nodeCount = latestByIp.size;
        const avgCommittedPerNode = nodeCount > 0 ? totalStorage / nodeCount : 0;

        return {
          date: new Date(bucketKey).toISOString(),
          avgCommittedPerNode,
          totalNodes: nodeCount,
          totalCommitted: totalStorage
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Limit to last 48 data points (24 hours with 30-min intervals)
    const limitedHistory = formattedHistory.slice(-48);

    return NextResponse.json({
      history: limitedHistory,
      hasData: limitedHistory.length >= 2,
      dataPoints: limitedHistory.length,
      timeRange: '24h',
      interval: '30min'
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // 5 min cache for semi-real-time
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
