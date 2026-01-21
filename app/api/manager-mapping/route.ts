/**
 * Manager Mapping API
 * Returns the mapping data for client-side use
 */

import { NextResponse } from 'next/server';
import managersData from '@/config/managers_node_data.json';

export async function GET() {
  try {
    // Build the mapping
    const mapping: Record<string, string> = {};
    
    for (const manager of managersData.managers) {
      for (const node of manager.nodes) {
        mapping[node.pnode_pubkey] = manager.manager_address;
      }
    }
    
    return NextResponse.json({
      success: true,
      mapping,
      stats: managersData.summary,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
