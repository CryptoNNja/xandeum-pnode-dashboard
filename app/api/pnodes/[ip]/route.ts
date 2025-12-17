import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { type PNode, type PNodeStatus } from "@/lib/types";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ip: string }> }
  ) {
    const { ip } = await params;
  
    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 });
    }

    // Query Supabase for the node
    const { data, error } = await supabase
      .from("pnodes")
      .select("*")
      .eq("ip", ip)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    // Convert Supabase row to PNode format
    const node: PNode = {
      ip: data.ip,
      status: data.status as PNodeStatus,
      version: data.version,
      stats: data.stats as unknown as import("@/lib/types").PNodeStats,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      city: data.city ?? null,
      country: data.country ?? null,
    };
  
    return NextResponse.json(node, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
  