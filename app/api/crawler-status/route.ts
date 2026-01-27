import { NextResponse } from 'next/server';

// Temporarily disable edge runtime to test
// export const runtime = 'edge';
export const revalidate = 60; // Cache for 60 seconds

/**
 * Get GitHub Actions workflow status for the crawler
 * 
 * Returns:
 * - status: 'success' | 'failure' | 'in_progress' | 'queued' | 'unknown'
 * - lastRun: ISO timestamp of last workflow run
 * - duration: Duration in seconds
 * - conclusion: 'success' | 'failure' | 'cancelled' | 'skipped'
 */
export async function GET() {
  try {
    const owner = 'CryptoNNja'; // Replace with your GitHub username/org
    const repo = 'xandeum-pnode-dashboard'; // Replace with your repo name
    const workflowFileName = 'crawler.yml'; // Your crawler workflow file
    
    // GitHub API token (optional but recommended for higher rate limits)
    const githubToken = process.env.GITHUB_TOKEN;
    
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Xandeum-Dashboard',
    };
    
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }
    
    // Fetch latest workflow runs (no status filter to get in_progress/queued too)
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/runs?per_page=1`,
      {
        headers,
        // Note: Cache headers instead of next.revalidate for better compatibility
        cache: 'no-store' as RequestCache,
      }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.workflow_runs || data.workflow_runs.length === 0) {
      return NextResponse.json({
        status: 'unknown',
        lastRun: null,
        duration: null,
        conclusion: null,
        message: 'No workflow runs found',
      });
    }
    
    const latestRun = data.workflow_runs[0];
    
    // Calculate duration
    const createdAt = new Date(latestRun.created_at);
    const updatedAt = new Date(latestRun.updated_at);
    const durationSeconds = Math.round((updatedAt.getTime() - createdAt.getTime()) / 1000);
    
    // Determine status
    let status: 'success' | 'failure' | 'in_progress' | 'queued' | 'unknown';
    
    if (latestRun.status === 'completed') {
      status = latestRun.conclusion === 'success' ? 'success' : 'failure';
    } else if (latestRun.status === 'in_progress') {
      status = 'in_progress';
    } else if (latestRun.status === 'queued') {
      status = 'queued';
    } else {
      status = 'unknown';
    }
    
    // Calculate time since last run
    const now = Date.now();
    const timeSinceLastRun = now - updatedAt.getTime();
    const minutesAgo = Math.floor(timeSinceLastRun / 60000);
    const hoursAgo = Math.floor(minutesAgo / 60);
    
    let timeAgo: string;
    if (minutesAgo < 1) {
      timeAgo = 'just now';
    } else if (minutesAgo < 60) {
      timeAgo = `${minutesAgo}m ago`;
    } else if (hoursAgo < 24) {
      timeAgo = `${hoursAgo}h ago`;
    } else {
      const daysAgo = Math.floor(hoursAgo / 24);
      timeAgo = `${daysAgo}d ago`;
    }
    
    return NextResponse.json({
      status,
      lastRun: latestRun.updated_at,
      duration: durationSeconds,
      conclusion: latestRun.conclusion,
      timeAgo,
      url: latestRun.html_url,
      runNumber: latestRun.run_number,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
    
  } catch (error: any) {
    console.error('Error fetching crawler status:', error);
    
    return NextResponse.json({
      status: 'unknown',
      lastRun: null,
      duration: null,
      conclusion: null,
      message: error.message || 'Failed to fetch crawler status',
    }, {
      status: 500,
    });
  }
}
