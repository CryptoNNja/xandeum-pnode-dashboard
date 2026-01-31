import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateNetworkHealthV2 } from "@/lib/network-health";
import type { PNode, PNodeStats } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 30;

    // Validate days parameter
    if (days < 1 || days > 90) {
      return NextResponse.json(
        { error: "Days parameter must be between 1 and 90" },
        { status: 400 }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const startTime = now - (days * 86400); // days ago in seconds

    // Query pnode_history for all records in the time range
    const { data: historyRecords, error } = await supabase
      .from("pnode_history")
      .select("*")
      .gte("ts", startTime)
      .lte("ts", now)
      .order("ts", { ascending: true });

    if (error) {
      console.error("Error fetching historical data:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!historyRecords || historyRecords.length === 0) {
      return NextResponse.json({
        history: [],
        message: "No historical data available for the specified time range"
      });
    }

    // Extract distinct timestamps manually
    const timestampSet = new Set<number>();
    historyRecords.forEach(record => timestampSet.add(record.ts));
    const timestamps = Array.from(timestampSet).sort((a, b) => a - b);

    // For each timestamp, calculate network health
    const historyData = timestamps.map(ts => {
      // Filter records for this timestamp
      const nodesAtTimestamp = historyRecords
        .filter(record => record.ts === ts)
        .map(record => {
          const stats: PNodeStats = {
            cpu_percent: record.cpu_percent ?? 0,
            ram_used: record.ram_used ?? 0,
            ram_total: record.ram_total ?? 1,
            uptime: record.uptime ?? 0,
            packets_sent: record.packets_sent ?? 0,
            packets_received: record.packets_received ?? 0,
            active_streams: 0,
            current_index: 0,
            file_size: record.file_size ?? 0,
            last_updated: 0,
            total_bytes: 0,
            total_pages: 0,
            storage_committed: record.storage_committed ?? 0,
          };

          const node: PNode = {
            ip: record.ip,
            pubkey: undefined,
            status: "online" as const,
            version: (record as any).version || "unknown", // 🆕 Use real version from history
            stats,
          };

          return node;
        });

      // Calculate network health for this timestamp
      const healthScore = calculateNetworkHealthV2(nodesAtTimestamp);

      return {
        timestamp: ts,
        date: new Date(ts * 1000).toISOString(),
        overall: healthScore.overall,
        rating: healthScore.rating,
        nodeCount: nodesAtTimestamp.length,
        components: {
          versionConsensus: healthScore.components.versionConsensus.score,
          networkUptime: healthScore.components.networkUptime.score,
          storageHealth: healthScore.components.storageHealth.score,
          resourceEfficiency: healthScore.components.resourceEfficiency.score,
          networkConnectivity: healthScore.components.networkConnectivity.score,
        },
      };
    });

    // Calculate trend (compare first and last week averages)
    let trend: 'improving' | 'stable' | 'declining' | 'unknown' = 'unknown';
    if (historyData.length >= 7) {
      const firstWeek = historyData.slice(0, 7);
      const lastWeek = historyData.slice(-7);
      
      const firstWeekAvg = firstWeek.reduce((sum, d) => sum + d.overall, 0) / firstWeek.length;
      const lastWeekAvg = lastWeek.reduce((sum, d) => sum + d.overall, 0) / lastWeek.length;
      
      const diff = lastWeekAvg - firstWeekAvg;
      if (diff > 5) trend = 'improving';
      else if (diff < -5) trend = 'declining';
      else trend = 'stable';
    }

    return NextResponse.json({
      history: historyData,
      trend,
      summary: {
        totalDataPoints: historyData.length,
        daysRequested: days,
        startDate: new Date(startTime * 1000).toISOString(),
        endDate: new Date(now * 1000).toISOString(),
        avgScore: historyData.length > 0
          ? Math.round(historyData.reduce((sum, d) => sum + d.overall, 0) / historyData.length)
          : 0,
      }
    }, {
      headers: { 
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600" 
      },
    });

  } catch (error) {
    console.error("Unexpected error in /api/network-health/history:", error);
    return NextResponse.json({
      error: "Failed to fetch network health history"
    }, { status: 500 });
  }
}
