import { NextResponse, type NextRequest } from "next/server";
import { type PNode, type PNodeStatus, type PNodeStats } from "@/lib/types";

// --- SIMULATED DATABASE ---
// In a real application, this data would come from a Supabase table.
const MOCK_DB: PNode[] = Array.from({ length: 116 }, (_, i) => {
    const ip = `192.168.${Math.floor(i / 255)}.${i % 255}`;
    const isActive = Math.random() > 0.2;
    const version = `v0.7.${Math.floor(Math.random() * 5)}`;
    
    let stats: PNodeStats = {
        active_streams: 0,
        cpu_percent: 0,
        current_index: 0,
        file_size: 0,
        last_updated: 0,
        packets_received: 0,
        packets_sent: 0,
        ram_total: 0,
        ram_used: 0,
        total_bytes: 0,
        total_pages: 0,
        uptime: 0,
    };

    if (isActive) {
        stats = {
            active_streams: Math.floor(Math.random() * 10),
            cpu_percent: Math.random() * 100,
            current_index: Math.floor(Math.random() * 10000),
            file_size: (Math.random() * 2 * 1e12), // Up to 2TB
            last_updated: Date.now() - Math.floor(Math.random() * 60000),
            packets_received: Math.floor(Math.random() * 1e6),
            packets_sent: Math.floor(Math.random() * 1e6),
            ram_total: 16 * 1e9, // 16GB
            ram_used: Math.random() * 16 * 1e9,
            total_bytes: Math.random() * (2 * 1e12),
            total_pages: Math.floor(Math.random() * 1000),
            uptime: Math.floor(Math.random() * 1e6),
        };
    }

    return {
        ip,
        status: isActive ? "active" : "gossip_only",
        version,
        stats,
    };
});
// --- END OF SIMULATED DATABASE ---

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ip: string }> }
  ) {
    const { ip } = await params;
  
    // --- SIMULATE DATABASE QUERY ---
    const node = MOCK_DB.find(p => p.ip === ip);
    // --- END OF SIMULATED QUERY ---
  
    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }
  
    return NextResponse.json(node, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
  