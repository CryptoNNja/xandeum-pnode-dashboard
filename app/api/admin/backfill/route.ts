import { NextResponse } from "next/server";
import { getAllPNodesStats } from "@/lib/api";
import { recordNodeStats } from "@/lib/supabase";

export async function POST(req: Request) {
  const secret = req.headers.get("x-backfill-secret") || "";
  if (!process.env.BACKFILL_SECRET || secret !== process.env.BACKFILL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await getAllPNodesStats();
    let inserted = 0;

    for (const r of results) {
      // recordNodeStats is safe (no-ops if supabase not configured)
      await recordNodeStats(r.ip, r.stats);
      inserted += 1;
    }

    return NextResponse.json({ inserted, scanned: results.length });
  } catch (e) {
    console.error("Backfill error:", e);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
