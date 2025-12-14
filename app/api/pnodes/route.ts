import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { type PNode, type PNodeStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "100", 10);
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
  supaQuery = supaQuery.order(sortBy, { ascending: sortDir === "asc" });
  supaQuery = supaQuery.range((page - 1) * limit, page * limit - 1);

  const { data, count, error } = await supaQuery;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Convert Supabase rows to PNode format
  const pnodes: PNode[] = (data || []).map((row) => ({
    ip: row.ip,
    status: row.status as PNodeStatus,
    version: row.version,
    stats: row.stats as unknown as import("@/lib/types").PNodeStats,
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
}
