import axios from "axios";
import { PNodeStats } from "./types";

export interface PNodeResponse {
  error: null | string;
  id: number;
  jsonrpc: string;
  result: PNodeStats;
}

export interface GossipPNode {
  ip: string;
  gossip_port: string;
  version: string;
  last_seen: string;
  pubkey: string;
}

// Function to retrieve the list of pNodes from gossip
export async function getGossipPNodes(): Promise<string[]> {
  try {
    const response = await axios.get("http://159.69.221.189:5000/gossip", {
      timeout: 5000,
    });
    const pnodes: GossipPNode[] = response.data.pnodes ?? [];
    return pnodes.map((p) => p.ip);
  } catch (error) {
    console.error("Gossip error:", error);
    // Fallback to hardcoded IPs
    return [
      "173.212.203.145",
      "173.212.220.65",
      "161.97.97.41",
      "192.190.136.36",
      "192.190.136.38",
      "192.190.136.28",
      "192.190.136.29",
      "207.244.255.1",
      "159.69.221.189",
    ];
  }
}

// Function to retrieve stats from a single pNode
export async function getPNodeStats(ip: string): Promise<PNodeStats | null> {
  try {
    const url = `http://${ip}:6000/rpc`;
    const response = await axios.post<PNodeResponse>(
      url,
      {
        jsonrpc: "2.0",
        method: "get-stats",
        id: 1,
      },
      {
        timeout: 5000, // 5 seconds timeout
      }
    );

    if (response.data && response.data.result) {
      return response.data.result;
    }

    return null;
  } catch (error) {
    console.error(`Error for ${ip}:`, error);
    return null;
  }
}

// Function to retrieve stats from ALL pNodes
export async function getAllPNodesStats(): Promise<
  { ip: string; stats: PNodeStats }[]
> {
  // First, retrieve the list of IPs from gossip
  const ips = await getGossipPNodes();

  const promises = ips.map(async (ip) => {
    const stats = await getPNodeStats(ip);
    return { ip, stats };
  });

  const results = await Promise.all(promises);

  // Type guard to ensure `stats` is not null in the return
  return results.filter(
    (r): r is { ip: string; stats: PNodeStats } => r.stats !== null
  );
}
