import { NextResponse } from 'next/server';

/**
 * GET /api/storage-history
 * Returns average storage committed per node for the last 7 days
 * 
 * TODO: Implement actual historical data fetching from pnode_history table
 * This endpoint is prepared for future implementation when historical
 * storage tracking is available in the database.
 */
export async function GET() {
  try {
    // Return empty history until pnode_history aggregation is implemented
    return NextResponse.json({ 
      history: [],
      message: 'Historical data not yet implemented'
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
