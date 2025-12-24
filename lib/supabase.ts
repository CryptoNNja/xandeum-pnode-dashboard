import { createClient } from "@supabase/supabase-js";
import type { PNodeStats } from "./types";
import type { Database } from "../types/supabase.mjs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Public client for use in the browser
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "Supabase: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}
export const supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!);


// Admin client for server-side operations
// Note: This will only work server-side, as SUPABASE_SERVICE_ROLE_KEY is not exposed to the browser
let supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;
if (typeof window === 'undefined') {
  // Server-side only
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
      }
    );
  } else {
    console.warn(
      "Supabase: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — history will be disabled"
    );
  }
}

export async function recordNodeStats(ip: string, stats: Partial<PNodeStats>) {
  if (!supabaseAdmin) {
    console.log("supabaseAdmin is null");
    return false;
  }
  try {
    const payload: Database["public"]["Tables"]["pnode_history"]["Insert"] = {
      ip,
      ts: Math.floor(Date.now() / 1000),
      cpu_percent: stats.cpu_percent ?? null,
      ram_used: stats.ram_used ?? null,
      ram_total: stats.ram_total ?? null,
      file_size: stats.file_size ?? null,
      uptime: stats.uptime ?? null,
      packets_sent: stats.packets_sent ?? null,
      packets_received: stats.packets_received ?? null,
    };
    const { error } = await supabaseAdmin
      .from("pnode_history")
      .insert([payload]);
    if (error) {
      console.error("Supabase insert error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Supabase recordNodeStats error:", e);
    return false;
  }
}

export async function getNodeHistory(ip: string, hours: number = 24) {
  if (!supabaseAdmin) {
    console.log("getNodeHistory: supabaseAdmin is null");
    return [];
  }
  // Prevent fetching history for localhost
  if (ip === '127.0.0.1' || ip === 'localhost') {
    console.log("getNodeHistory: ignoring localhost");
    return [];
  }
  const since = Math.floor(Date.now() / 1000) - hours * 3600;
  const { data, error } = await supabaseAdmin
    .from("pnode_history")
    .select("*")
    .eq("ip", ip)
    .gte("ts", since)
    .order("ts", { ascending: true });
  if (error) {
    console.error("Supabase getNodeHistory error:", error);
    return [];
  }
  console.log(
    "getNodeHistory: found",
    data?.length || 0,
    "points for",
    ip,
    "in last",
    hours,
    "hours"
  );
  return data || [];
}
