import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateNodeScore } from "@/lib/scoring";
import type { PNode, PNodeStats } from "@/lib/types";

export async function GET() {
  try {
    // Calculate timestamp for 7 days ago
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - (7 * 86400); // 7 days in seconds

    // Query pnode_history for records from approximately 7 days ago
    // Use a wider window: [now - 8 days ; now - 6 days] to account for daily crawl
    const windowStart = sevenDaysAgo - (2 * 86400); // 2 days before 7 days ago
    const windowEnd = sevenDaysAgo + (2 * 86400);   // 2 days after 7 days ago

    const { data: historyRecords, error } = await supabase
      .from("pnode_history")
      .select("*")
      .gte("ts", windowStart)
      .lte("ts", windowEnd)
      .order("ts", { ascending: false });

    if (error) {
      console.error("Error fetching historical data for last week:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no historical data found, return null
    if (!historyRecords || historyRecords.length === 0) {
      return NextResponse.json({
        networkHealthScore: null,
        message: "No historical data available from 7 days ago"
      });
    }

    // Group records by IP and pick the one closest to 7 days ago
    const nodesByIp = new Map<string, typeof historyRecords[0]>();
    for (const record of historyRecords) {
      const existing = nodesByIp.get(record.ip);
      if (!existing) {
        nodesByIp.set(record.ip, record);
      } else {
        // Keep the record closest to 7 days ago
        const existingDiff = Math.abs(existing.ts - sevenDaysAgo);
        const currentDiff = Math.abs(record.ts - sevenDaysAgo);
        if (currentDiff < existingDiff) {
          nodesByIp.set(record.ip, record);
        }
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
        pubkey: undefined, // Historical data doesn't have pubkey yet
        status: "online" as const, // Historical records are only saved for online nodes
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
        message: "No active nodes found in historical data from 7 days ago"
      });
    }

    const averageScore = Math.round(
      validScores.reduce((sum, score) => sum + score, 0) / validScores.length
    );

    return NextResponse.json({
      networkHealthScore: averageScore,
      nodeCount: validScores.length,
      timestamp: sevenDaysAgo
    }, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });

  } catch (error) {
    console.error("Unexpected error in /api/network-health/last-week:", error);
    return NextResponse.json({
      error: "Failed to calculate historical network health from 7 days ago"
    }, { status: 500 });
  }
}

