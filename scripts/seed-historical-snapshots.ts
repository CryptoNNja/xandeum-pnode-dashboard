// Seed historical snapshots for testing growth metrics
// This creates fake historical data for the past 7 days with slight variations
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedHistoricalSnapshots() {
  console.log("🌱 Seeding historical snapshots for testing...");

  // Get current live metrics as baseline
  const { data: pnodesData } = await supabase
    .from("pnodes")
    .select("*")
    .neq("ip", "127.0.0.1");

  if (!pnodesData || pnodesData.length === 0) {
    console.error("❌ No pnodes data available");
    return;
  }

  const currentTotal = pnodesData.length;
  const currentActive = pnodesData.filter((p: any) => p.status === "active").length;
  const currentPrivate = pnodesData.filter((p: any) => p.status === "gossip_only").length;
  const currentPages = pnodesData
    .filter((p: any) => p.status === "active")
    .reduce((sum: number, p: any) => sum + (p.stats?.total_pages ?? 0), 0);
  const currentStorage = pnodesData
    .filter((p: any) => p.status === "active")
    .reduce((sum: number, p: any) => sum + (p.stats?.file_size ?? 0), 0);

  console.log(`📊 Current metrics: ${currentActive} active nodes, ${currentPages.toLocaleString()} pages`);

  // Create 7 days of historical data with realistic growth
  const snapshots = [];
  const today = new Date();

  for (let daysAgo = 7; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];

    // Simulate gradual growth over 7 days
    // Nodes: -5% to -10% 7 days ago, growing to current
    const growthFactor = 1 - (daysAgo * 0.015); // 1.5% decline per day backwards
    const randomVariation = 0.98 + (Math.random() * 0.04); // ±2% random variation

    const activeNodes = Math.round(currentActive * growthFactor * randomVariation);
    const totalPages = Math.round(currentPages * growthFactor * randomVariation);
    const totalStorage = Math.round(currentStorage * growthFactor * randomVariation);

    snapshots.push({
      snapshot_date: dateStr,
      total_nodes: activeNodes + currentPrivate,
      active_nodes: activeNodes,
      private_nodes: currentPrivate,
      total_storage_bytes: totalStorage,
      total_pages: totalPages,
      avg_cpu_percent: 15 + Math.random() * 10, // 15-25%
      avg_ram_percent: 35 + Math.random() * 15, // 35-50%
      avg_uptime_hours: 48 + Math.random() * 96, // 48-144h
      network_health_score: 75 + Math.round(Math.random() * 15), // 75-90
    });
  }

  // Insert all snapshots
  const { error } = await supabase
    .from("network_snapshots")
    .upsert(snapshots, { onConflict: 'snapshot_date' });

  if (error) {
    console.error("❌ Error seeding snapshots:", error);
    return;
  }

  console.log("✅ Successfully seeded 8 days of historical snapshots!");
  console.log("\n📈 Growth simulation:");
  console.log(`   - 7 days ago: ${snapshots[0].active_nodes} nodes, ${snapshots[0].total_pages.toLocaleString()} pages`);
  console.log(`   - Today: ${snapshots[7].active_nodes} nodes, ${snapshots[7].total_pages.toLocaleString()} pages`);

  const nodeGrowth = ((snapshots[7].active_nodes - snapshots[0].active_nodes) / snapshots[0].active_nodes) * 100;
  const pagesGrowth = ((snapshots[7].total_pages - snapshots[0].total_pages) / snapshots[0].total_pages) * 100;

  console.log(`   - Network Growth: ${nodeGrowth > 0 ? '+' : ''}${nodeGrowth.toFixed(1)}%`);
  console.log(`   - Storage Growth: ${pagesGrowth > 0 ? '+' : ''}${pagesGrowth.toFixed(1)}%`);
  console.log("\n✨ Refresh your dashboard to see the growth KPIs!");
}

seedHistoricalSnapshots();
