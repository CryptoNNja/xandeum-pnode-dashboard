import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import type { NetworkType, PNodeStatus } from "@/lib/types";

type Summary = {
  total: number;
  public: number;
  private: number;

  mainnet: number;
  mainnetPublic: number;
  mainnetPrivate: number;

  devnet: number;
  devnetPublic: number;
  devnetPrivate: number;

  unknownNetwork: number;
  lastCrawledAt: string | null;
};

export async function GET(_request: NextRequest) {
  try {
    // Fetch only minimal fields to compute counters.
    // Row count is small (~hundreds), so a single query is simpler and cheap.
    // Note: our generated Supabase types are currently missing some columns (e.g. `network`).
    // Cast to `any` here to avoid breaking the build while keeping runtime behavior correct.
    // Include localhost - it's a legitimate node with pubkey and storage
    const { data, error } = await (supabase as any)
      .from("pnodes")
      .select("status, node_type, network, last_crawled_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data || [];

    let total = 0;
    let pub = 0;
    let priv = 0;
    let mainnet = 0;
    let mainnetPublic = 0;
    let mainnetPrivate = 0;

    let devnet = 0;
    let devnetPublic = 0;
    let devnetPrivate = 0;

    let unknownNetwork = 0;
    let lastCrawledAt: string | null = null;

    for (const r of rows) {
      total++;
      const nodeType = (r as any).node_type as string | null;
      if (nodeType === "public") pub++;
      else priv++;

      const net = (r as any).network as NetworkType | null;
      if (net === "MAINNET") {
        mainnet++;
        if (nodeType === "public") mainnetPublic++;
        else mainnetPrivate++;
      } else if (net === "DEVNET") {
        devnet++;
        if (nodeType === "public") devnetPublic++;
        else devnetPrivate++;
      } else {
        unknownNetwork++;
      }

      const ts = (r as any).last_crawled_at as string | null;
      if (ts && (!lastCrawledAt || ts > lastCrawledAt)) lastCrawledAt = ts;
    }

    const summary: Summary = {
      total,
      public: pub,
      private: priv,

      mainnet,
      mainnetPublic,
      mainnetPrivate,

      devnet,
      devnetPublic,
      devnetPrivate,

      unknownNetwork,
      lastCrawledAt,
    };

    return NextResponse.json(summary, {
      headers: {
        // Cache on the edge to protect Vercel functions under polling.
        // Short TTL to feel real-time.
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=50",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
