import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * 🆕 Network Stats API
 * Returns statistics about MAINNET vs DEVNET nodes
 */
export async function GET() {
  try {
    // Get total nodes count
    const { count: totalCount } = await supabase
      .from("pnodes")
      .select("*", { count: "exact", head: true })
      .neq("ip", "127.0.0.1");

    // Get MAINNET nodes
    const { data: mainnetNodes, count: mainnetCount } = await supabase
      .from("pnodes")
      .select("stats", { count: "exact" })
      .eq("network", "MAINNET")
      .neq("ip", "127.0.0.1");

    // Get DEVNET nodes
    const { data: devnetNodes, count: devnetCount } = await supabase
      .from("pnodes")
      .select("stats", { count: "exact" })
      .eq("network", "DEVNET")
      .neq("ip", "127.0.0.1");

    // Calculate storage for each network
    const mainnetStorage = mainnetNodes?.reduce((sum, node: any) => {
      return sum + (node.stats?.storage_committed || 0);
    }, 0) || 0;

    const devnetStorage = devnetNodes?.reduce((sum, node: any) => {
      return sum + (node.stats?.storage_committed || 0);
    }, 0) || 0;

    return NextResponse.json({
      total: {
        nodes: totalCount || 0,
        storage: mainnetStorage + devnetStorage,
      },
      mainnet: {
        nodes: mainnetCount || 0,
        storage: mainnetStorage,
        percentage: totalCount ? Math.round((mainnetCount || 0) / totalCount * 100) : 0,
      },
      devnet: {
        nodes: devnetCount || 0,
        storage: devnetStorage,
        percentage: totalCount ? Math.round((devnetCount || 0) / totalCount * 100) : 0,
      },
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: any) {
    console.error("Network Stats API Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
