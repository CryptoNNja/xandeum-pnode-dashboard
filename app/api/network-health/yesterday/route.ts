import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateNodeScore } from "@/lib/scoring";
import type { PNode, PNodeStats } from "@/lib/types";

export async function GET() {
  try {
    // Calculate timestamp for 24 hours ago
    const now = Math.floor(Date.now() / 1000);
    const twentyFourHoursAgo = now - 86400;

    // Query pnode_history for records around 24 hours ago
    // NOTE: The crawler typically runs once every 24h at a fixed time.
    // If we only look at a tiny ±15min window, we'll often miss the snapshot
    // unless the user opens the dashboard exactly at the crawl time.
    //
    // Instead, we look in a broader window [now - 36h ; now - 12h] and,
    // for each IP, pick the record whose timestamp is closest to exactly 24h ago.
    const windowStart = now - 36 * 3600; // 36 hours ago
    const windowEnd = now - 12 * 3600;   // 12 hours ago

    const { data: historyRecords, error } = await supabase
      .from("pnode_history")
      .select("*")
      .gte("ts", windowStart)
      .lte("ts", windowEnd);

    if (error) {
      console.error("Error fetching historical data:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no historical data found in the broader window, return null
    if (!historyRecords || historyRecords.length === 0) {
      return NextResponse.json({
        networkHealthScore: null,
        message: "No historical data available from 24 hours ago"
      });
    }

    // Group records by IP and, for each node, pick the record closest to 24h ago
    const nodesByIp = new Map<string, typeof historyRecords[0]>();
    for (const record of historyRecords) {
      const existing = nodesByIp.get(record.ip);
      if (!existing) {
        nodesByIp.set(record.ip, record);
        continue;
      }

      const existingDiff = Math.abs((existing.ts as number) - twentyFourHoursAgo);
      const candidateDiff = Math.abs((record.ts as number) - twentyFourHoursAgo);

      if (candidateDiff < existingDiff) {
        nodesByIp.set(record.ip, record);
      }
    }

    // Reconstruct PNode objects from historical data
    const historicalNodes: PNode[] = Array.from(nodesByIp.values()).map(record => {
      const stats: PNodeStats = {
        cpu_percent: record.cpu_percent ?? 0,
        ram_used: record.ram_used ?? 0,
        ram_total: record.ram_total ?? 0,
        uptime: record.uptime ?? 0,
        packets_sent: record.packets_sent ?? 0,
        packets_received: record.packets_received ?? 0,
        active_streams: 0,
        current_index: 0,
        file_size: record.file_size ?? 0,
        last_updated: 0,
        total_bytes: 0,
        total_pages: 0,
      };

      return {
        ip: record.ip,
        status: "active" as const, // Historical records are only saved for active nodes
        version: "unknown",
        stats,
      };
    });

    // Calculate scores for all historical nodes
    const scores = historicalNodes.map(node => calculateNodeScore(node));

    // Filter out zero scores (private nodes) and calculate average
    const validScores = scores.filter(score => score > 0);

    if (validScores.length === 0) {
      return NextResponse.json({
        networkHealthScore: null,
        message: "No active nodes found in historical data"
      });
    }

    const averageScore = Math.round(
      validScores.reduce((sum, score) => sum + score, 0) / validScores.length
    );

    return NextResponse.json({
      networkHealthScore: averageScore,
      nodeCount: validScores.length,
      timestamp: twentyFourHoursAgo
    }, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });

  } catch (error) {
    console.error("Unexpected error in /api/network-health/yesterday:", error);
    return NextResponse.json({
      error: "Failed to calculate historical network health"
    }, { status: 500 });
  }
}
