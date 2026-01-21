/**
 * API Route: Manager Board
 * 
 * Returns aggregated statistics for multi-node operators
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.mjs';
import type { PNode } from '@/lib/types';
import { groupNodesByManager, getManagerStats, getTopManagers, getMultiNodeOperators } from '@/lib/manager-profiles';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topLimit = parseInt(searchParams.get('top') || '10', 10);
    const multiNodeOnly = searchParams.get('multiNode') === 'true';

    // Fetch all nodes with pubkeys
    const { data: nodes, error } = await supabase
      .from('pnodes')
      .select('*')
      .not('pubkey', 'is', null);

    if (error) {
      console.error('Error fetching nodes:', error);
      return NextResponse.json({ error: 'Failed to fetch nodes' }, { status: 500 });
    }

    // Group nodes by manager (pubkey)
    const managers = groupNodesByManager(nodes as unknown as PNode[]);

    // Get overall statistics
    const stats = getManagerStats(managers);

    // Get top managers or multi-node operators
    const topManagers = multiNodeOnly 
      ? getMultiNodeOperators(managers)
      : getTopManagers(managers, topLimit);

    // Convert Sets to Arrays for JSON serialization
    const managersData = topManagers.map((manager) => ({
      ...manager,
      networks: Array.from(manager.networks),
      countries: Array.from(manager.countries),
      // Don't include full nodes array in API response (too large)
      nodes: manager.nodes.map(n => ({
        ip: n.ip,
        city: n.city,
        country: n.country,
        status: n.status,
        network: n.network,
      })),
    }));

    return NextResponse.json({
      success: true,
      stats,
      managers: managersData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/managers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
