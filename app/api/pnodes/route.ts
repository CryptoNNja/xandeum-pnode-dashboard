import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { type PNode, type PNodeStatus, type NetworkType } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "1000", 10); // Default to a large number to get all for now
    const sortBy = searchParams.get("sortBy") || "ip";
    const sortDir = searchParams.get("sortDir") || "asc";
    const query = searchParams.get("query")?.toLowerCase() || "";
    const statusFilter = searchParams.get("status") as PNodeStatus | "all" || "all";
    const networkFilter = searchParams.get("network") as NetworkType | "all" || "all"; // 🆕 Network filter

    // Build Supabase query
    let supaQuery = supabase
      .from("pnodes")
      .select("*", { count: "exact" })
      .neq("ip", "127.0.0.1"); // Exclude localhost

    if (statusFilter !== "all") {
      supaQuery = supaQuery.eq("status", statusFilter);
    }

    // 🆕 Filter by network (MAINNET/DEVNET)
    if (networkFilter !== "all") {
      supaQuery = supaQuery.eq("network", networkFilter);
    }
    
    if (query) {
      supaQuery = supaQuery.or(
        `ip.ilike.%${query}%,version.ilike.%${query}%,status.ilike.%${query}%`
      );
    }

    // Safety: Only sort by columns that exist. 
    // JSONB sorting (stats->...) is possible but requires different syntax.
    // For now, we default to IP and handle advanced sorting on frontend if needed.
    const dbColumns = ["ip", "status", "version", "lat", "lng", "city", "country"];
    if (dbColumns.includes(sortBy)) {
      supaQuery = supaQuery.order(sortBy, { ascending: sortDir === "asc" });
    } else {
      supaQuery = supaQuery.order("ip", { ascending: true });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    supaQuery = supaQuery.range(from, to);

    const { data, count, error } = await supaQuery;
    
    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert Supabase rows to PNode format
    const pnodes: PNode[] = (data || []).map((row) => ({
      ip: row.ip,
      status: row.status as PNodeStatus,
      version: row.version ?? undefined,
      pubkey: row.pubkey ?? undefined,
      stats: row.stats as unknown as import("@/lib/types").PNodeStats,
      network: (row as any).network as NetworkType, // 🆕 Network type
      network_confidence: (row as any).network_confidence, // 🆕 Confidence
      source: (row as any).source, // 🆕 Data source (crawler/registry/both)
      is_official: (row as any).is_official, // 🆕 Official registry flag
      last_seen_gossip: (row as any).last_seen_gossip 
        ? new Date((row as any).last_seen_gossip).getTime() / 1000 
        : undefined, // 🆕 Convert ISO timestamp to Unix seconds
      lat: row.lat,
      lng: row.lng,
      city: row.city,
      country: row.country,
      country_code: (row as any).country_code,
    }));

    return NextResponse.json({
      data: pnodes,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: count ? Math.ceil(count / limit) : 1,
      },
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: any) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
