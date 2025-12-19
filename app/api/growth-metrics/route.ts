import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET() {
  try {
    // Fetch the most recent snapshots (flexible approach)
    // This allows growth calculation even with only 2 days of data
    const { data: snapshots, error } = await supabase
      .from("network_snapshots")
      .select("*")
      .order("snapshot_date", { ascending: false })
      .limit(8); // Get last 8 days max

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If we don't have enough data yet (need at least 2 snapshots)
    if (!snapshots || snapshots.length < 2) {
      return NextResponse.json({
        networkGrowthRate: 0,
        storageGrowthRate: 0,
        hasHistoricalData: false,
        daysOfData: snapshots?.length || 0,
        message: snapshots?.length === 1
          ? "Only 1 day of data. Growth will be calculated tomorrow."
          : "Not enough historical data yet. Run save-daily-snapshot.ts to populate."
      });
    }

    // Use the most recent snapshot vs the oldest in the last 7-8 days
    const mostRecentSnapshot = snapshots[0]; // Already sorted DESC
    const oldestSnapshot = snapshots[snapshots.length - 1];

    // Calculate days between snapshots
    const recentDate = new Date(mostRecentSnapshot.snapshot_date);
    const oldestDate = new Date(oldestSnapshot.snapshot_date);
    const daysDiff = Math.round((recentDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate growth rates
    const networkGrowth = oldestSnapshot.active_nodes > 0
      ? ((mostRecentSnapshot.active_nodes - oldestSnapshot.active_nodes) / oldestSnapshot.active_nodes) * 100
      : 0;

    const storageGrowth = oldestSnapshot.total_pages > 0
      ? ((mostRecentSnapshot.total_pages - oldestSnapshot.total_pages) / oldestSnapshot.total_pages) * 100
      : 0;

    return NextResponse.json({
      networkGrowthRate: Math.round(networkGrowth * 10) / 10, // 1 decimal
      storageGrowthRate: Math.round(storageGrowth * 10) / 10,
      hasHistoricalData: true,
      daysOfData: snapshots.length,
      daysBetweenSnapshots: daysDiff,
      mostRecentMetrics: {
        date: mostRecentSnapshot.snapshot_date,
        activeNodes: mostRecentSnapshot.active_nodes,
        totalPages: mostRecentSnapshot.total_pages,
        networkHealth: mostRecentSnapshot.network_health_score
      },
      oldestMetrics: {
        date: oldestSnapshot.snapshot_date,
        activeNodes: oldestSnapshot.active_nodes,
        totalPages: oldestSnapshot.total_pages,
        networkHealth: oldestSnapshot.network_health_score
      }
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200"
      }
    });

  } catch (err: any) {
    console.error("API Route Error:", err);
    return NextResponse.json({
      error: err.message || "Internal Server Error",
      networkGrowthRate: 0,
      storageGrowthRate: 0,
      hasHistoricalData: false
    }, { status: 500 });
  }
}
