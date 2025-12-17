import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: "./.env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function debugNetworkHealthYesterday() {
  console.log("🔍 Analyzing pnode_history around 24h ago...\n");

  const now = Math.floor(Date.now() / 1000);
  const twentyFourHoursAgo = now - 86400;
  const windowStart = twentyFourHoursAgo - 900; // 15 minutes before
  const windowEnd = twentyFourHoursAgo + 900; // 15 minutes after

  console.log(
    `⏱  Time window: [${new Date(
      windowStart * 1000
    ).toISOString()} .. ${new Date(windowEnd * 1000).toISOString()}]`
  );

  const { data, error } = await supabaseAdmin
    .from("pnode_history")
    .select(
      "ip, ts, cpu_percent, ram_used, ram_total, file_size, uptime, packets_sent, packets_received"
    )
    .gte("ts", windowStart)
    .lte("ts", windowEnd)
    .order("ts", { ascending: true });

  if (error) {
    console.error("❌ Error fetching pnode_history:", error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("⚠️  No pnode_history records found in the 24h window.");
    console.log(
      "   → This explains why /api/network-health/yesterday can return null."
    );
    process.exit(0);
  }

  const uniqueIps = new Set<string>();
  for (const row of data) {
    uniqueIps.add(row.ip as string);
  }

  console.log(`✅ Found ${data.length} history points in the window.`);
  console.log(`   Unique nodes: ${uniqueIps.size}`);
  console.log("");

  console.log("📌 Sample records (up to 10):\n");
  data.slice(0, 10).forEach((row, index) => {
    console.log(
      `  ${String(index + 1).padStart(2, "0")}. ip=${row.ip} ts=${new Date(
        (row.ts as number) * 1000
      ).toISOString()} cpu=${row.cpu_percent} uptime=${row.uptime}`
    );
  });

  console.log("\n📈 Per-IP distribution:");
  const countsByIp = new Map<string, number>();
  for (const row of data) {
    const ip = row.ip as string;
    countsByIp.set(ip, (countsByIp.get(ip) ?? 0) + 1);
  }
  Array.from(countsByIp.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([ip, count]) => {
      console.log(`  ${ip} → ${count} points`);
    });

  console.log("\n✨ Analysis complete.");
}

debugNetworkHealthYesterday().catch((error) => {
  console.error("An unexpected error occurred:", error);
  process.exit(1);
});


