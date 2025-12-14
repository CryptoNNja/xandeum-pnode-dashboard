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

// Fonction pour récupérer la liste des pNodes depuis le gossip
export async function getGossipPNodes(): Promise<string[]> {
  try {
    const response = await axios.get("http://159.69.221.189:5000/gossip", {
      timeout: 5000,
    });
    const pnodes: GossipPNode[] = response.data.pnodes ?? [];
    return pnodes.map((p) => p.ip);
  } catch (error) {
    console.error("Gossip error:", error);
    // Fallback sur quelques IPs hardcodées
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

// Fonction pour récupérer les stats d'un pNode
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
        timeout: 5000, // Timeout de 5 secondes
      }
    );

    if (response.data && response.data.result) {
      return response.data.result;
    }

    return null;
  } catch (error) {
    console.error(`Erreur pour ${ip}:`, error);
    return null;
  }
}

// Fonction pour récupérer les stats de TOUS les pNodes
export async function getAllPNodesStats(): Promise<
  { ip: string; stats: PNodeStats }[]
> {
  // D'abord, récupère la liste des IPs depuis le gossip
  const ips = await getGossipPNodes();

  const promises = ips.map(async (ip) => {
    const stats = await getPNodeStats(ip);
    return { ip, stats };
  });

  const results = await Promise.all(promises);

  // Type guard pour garantir que `stats` n'est plus null dans le retour
  return results.filter(
    (r): r is { ip: string; stats: PNodeStats } => r.stats !== null
  );
}
