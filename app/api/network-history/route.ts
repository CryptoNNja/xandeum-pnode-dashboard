import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET() {
  try {
    // Fetch last 30 days of snapshots for the growth chart
    // ORDER BY DESC first to get the most recent 30, then reverse for chart display
    const { data: snapshots, error } = await supabase
      .from("network_snapshots")
      .select("snapshot_date, active_nodes, total_nodes, network_health_score")
      .order("snapshot_date", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no data, return empty array
    if (!snapshots || snapshots.length === 0) {
      return NextResponse.json({
        history: [],
        hasData: false,
        message: "No historical data available yet. Run save-daily-snapshot.ts to populate."
      });
    }

    // Format data for the chart with both public and total nodes
    // Reverse to show oldest to newest for chart display (left to right)
    const formattedHistory = snapshots.reverse().map(snapshot => {
      const date = new Date(snapshot.snapshot_date);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        publicNodes: snapshot.active_nodes || 0,
        totalNodes: snapshot.total_nodes || 0,
        fullDate: snapshot.snapshot_date
      };
    });

    return NextResponse.json({
      history: formattedHistory,
      hasData: true,
      dataPoints: formattedHistory.length
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200"
      }
    });

  } catch (err: any) {
    console.error("API Route Error:", err);
    return NextResponse.json({
      error: err.message || "Internal Server Error",
      history: [],
      hasData: false
    }, { status: 500 });
  }
}
