import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { type PNode, type PNodeStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "1000", 10); // Default to a large number to get all for now
    const sortBy = searchParams.get("sortBy") || "ip";
    const sortDir = searchParams.get("sortDir") || "asc";
    const query = searchParams.get("query")?.toLowerCase() || "";
    const statusFilter = searchParams.get("status") as PNodeStatus | "all" || "all";

    // Build Supabase query
    let supaQuery = supabase
      .from("pnodes")
      .select("*", { count: "exact" });

    if (statusFilter !== "all") {
      supaQuery = supaQuery.eq("status", statusFilter);
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
      version: row.version,
      stats: row.stats as unknown as import("@/lib/types").PNodeStats,
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
