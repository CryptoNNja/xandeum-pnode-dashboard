// Reset snapshots: delete all mock data and save only today's real snapshot
import { createClient } from "@supabase/supabase-js";
import { calculateNodeScore } from "../lib/scoring";
import type { PNode } from "../lib/types";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function resetToRealSnapshot() {
  console.log("🧹 Cleaning up mock data and saving real snapshot...");

  // 1. Delete all existing snapshots
  const { error: deleteError } = await supabase
    .from("network_snapshots")
    .delete()
    .neq("id", 0); // Delete all

  if (deleteError) {
    console.error("❌ Error deleting old snapshots:", deleteError);
    return;
  }

  console.log("✅ Mock data cleared");

  // 2. Fetch current real data
  const { data: pnodesData, error: fetchError } = await supabase
    .from("pnodes")
    .select("*")
    .neq("ip", "127.0.0.1");

  if (fetchError) {
    console.error("❌ Error fetching pnodes:", fetchError);
    return;
  }

  const pnodes: PNode[] = (pnodesData || []).map((row) => ({
    ip: row.ip,
    status: row.status,
    version: row.version,
    pubkey: row.pubkey ?? undefined,
    stats: row.stats,
    lat: row.lat,
    lng: row.lng,
    city: row.city,
    country: row.country,
    country_code: (row as any).country_code,
  }));

  // 3. Calculate real metrics
  const totalNodes = pnodes.length;
  const activeNodes = pnodes.filter(p => p.status === "active");
  const privateNodes = pnodes.filter(p => p.status === "gossip_only");

  const totalStorageBytes = activeNodes.reduce(
    (sum, p) => sum + (p.stats?.file_size ?? 0),
    0
  );

  const totalPages = activeNodes.reduce(
    (sum, p) => sum + (p.stats?.total_pages ?? 0),
    0
  );

  const validCpuNodes = activeNodes.filter(p =>
    Number.isFinite(p.stats?.cpu_percent) && p.stats.cpu_percent > 0
  );
  const avgCpuPercent = validCpuNodes.length > 0
    ? validCpuNodes.reduce((sum, p) => sum + p.stats.cpu_percent, 0) / validCpuNodes.length
    : 0;

  const validRamNodes = activeNodes.filter(p =>
    p.stats?.ram_total > 0 && Number.isFinite(p.stats.ram_used)
  );
  const avgRamPercent = validRamNodes.length > 0
    ? validRamNodes.reduce((sum, p) =>
        sum + ((p.stats.ram_used / p.stats.ram_total) * 100), 0
      ) / validRamNodes.length
    : 0;

  const validUptimeNodes = activeNodes.filter(p =>
    Number.isFinite(p.stats?.uptime) && p.stats.uptime > 0
  );
  const avgUptimeHours = validUptimeNodes.length > 0
    ? validUptimeNodes.reduce((sum, p) =>
        sum + (p.stats.uptime / 3600), 0
      ) / validUptimeNodes.length
    : 0;

  const nodeScores = activeNodes
    .map(p => calculateNodeScore(p))
    .filter(score => score > 0);
  const networkHealthScore = nodeScores.length > 0
    ? Math.round(nodeScores.reduce((sum, s) => sum + s, 0) / nodeScores.length)
    : 0;

  // 4. Save today's real snapshot
  const today = new Date().toISOString().split('T')[0];

  const { error: insertError } = await supabase
    .from("network_snapshots")
    .insert({
      snapshot_date: today,
      total_nodes: totalNodes,
      active_nodes: activeNodes.length,
      private_nodes: privateNodes.length,
      total_storage_bytes: totalStorageBytes,
      total_pages: totalPages,
      avg_cpu_percent: Math.round(avgCpuPercent * 100) / 100,
      avg_ram_percent: Math.round(avgRamPercent * 100) / 100,
      avg_uptime_hours: Math.round(avgUptimeHours * 100) / 100,
      network_health_score: networkHealthScore,
    });

  if (insertError) {
    console.error("❌ Error saving snapshot:", insertError);
    return;
  }

  console.log("✅ Real snapshot saved for today!");
  console.log(`📊 Current metrics:`);
  console.log(`   - Total Nodes: ${totalNodes}`);
  console.log(`   - Active Nodes: ${activeNodes.length}`);
  console.log(`   - Total Pages: ${totalPages.toLocaleString()}`);
  console.log(`   - Network Health: ${networkHealthScore}/100`);
  console.log("\n📅 Growth KPIs will show 0% until tomorrow's snapshot is saved.");
  console.log("   Then it will calculate day-over-day growth!");
}

resetToRealSnapshot();
