import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { recordNodeStats, getNodeHistory } from "../lib/supabase.ts";

async function main() {
  // Test IP and stats; adjust as needed
  const ip = "173.212.203.145";
  const stats = {
    active_streams: 2,
    cpu_percent: 15.2,
    current_index: 1,
    file_size: 123456789,
    last_updated: Math.floor(Date.now() / 1000),
    packets_received: 500000,
    packets_sent: 800000,
    ram_total: 8000000000,
    ram_used: 4000000000,
    total_bytes: 987654321,
    total_pages: 123,
    uptime: 7200,
  };

  try {
    const success = await recordNodeStats(ip, stats);
    if (success) {
      console.log("Point inserted successfully!");
      // Debug: verify we can retrieve the data
      const points = await getNodeHistory(ip, 24);
      console.log("Points fetched for", ip, ":", points.length);
      if (points.length > 0) {
        console.log("Last point:", points[points.length - 1]);
      }
    } else {
      console.log("Insertion failed");
    }
  } catch (err) {
    console.error("Error while inserting:", err);
  }
}

main();
