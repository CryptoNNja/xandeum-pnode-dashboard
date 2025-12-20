import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET() {
  try {
    // Fetch the singleton network metadata record
    const { data, error } = await supabase
      .from("network_metadata")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no data yet, return defaults
    if (!data) {
      return NextResponse.json({
        networkTotal: 0,
        crawledNodes: 0,
        activeNodes: 0,
        coveragePercent: 0,
        lastUpdated: null
      });
    }

    // Calculate coverage percentage
    const coveragePercent = data.network_total > 0
      ? Math.round((data.crawled_nodes / data.network_total) * 100 * 10) / 10
      : 0;

    return NextResponse.json({
      networkTotal: data.network_total,
      crawledNodes: data.crawled_nodes,
      activeNodes: data.active_nodes,
      coveragePercent,
      lastUpdated: data.last_updated
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200"
      }
    });

  } catch (err: any) {
    console.error("API Route Error:", err);
    return NextResponse.json({
      error: err.message || "Internal Server Error",
      networkTotal: 0,
      crawledNodes: 0,
      activeNodes: 0,
      coveragePercent: 0
    }, { status: 500 });
  }
}
