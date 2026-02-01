/**
 * Manager Mapping API
 * Returns the mapping data for client-side use
 * 
 * Data structure: pnode_registry.json
 * - Flat registry object for O(1) lookups
 * - Operator metadata for statistics
 */

import { NextResponse } from 'next/server';
import registryData from '@/config/pnode_registry.json';

export async function GET() {
  try {
    // Return the flat mapping (no transformation needed - already optimized!)
    return NextResponse.json({
      success: true,
      mapping: registryData.registry,
      stats: {
        total_managers: registryData.meta.total_operators,
        total_pnode_pubkeys: registryData.meta.total_nodes,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
