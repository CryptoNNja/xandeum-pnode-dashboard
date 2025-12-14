import { NextResponse, type NextRequest } from "next/server";
import { getNodeHistory } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ip: string }> }
) {
  const { ip } = await params;
  const { searchParams } = new URL(request.url);
  const hours = parseInt(searchParams.get("hours") || "24", 10);

  if (!ip) {
    return NextResponse.json({ error: "IP address is required" }, { status: 400 });
  }

  const historyData = await getNodeHistory(ip, hours);

  return NextResponse.json({ ip, points: historyData }, {
    // Cache for 5 minutes on the client and at the edge
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
