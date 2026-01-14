import { NextResponse } from 'next/server';
import { main as runCrawler } from '../../../../scripts/crawler'; // Adjust path as needed

export async function GET(request: Request) {
  try {
    // Check if running in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Verify request comes from authorized sources only (skip in development)
    if (!isDevelopment) {
      const isVercelCron = request.headers.get('x-vercel-cron') === '1';
      const userAgent = request.headers.get('user-agent') || '';
      const isGitHubAction = userAgent.includes('GitHub-Hookshot') || userAgent.includes('github-actions');
      
      // Check for manual authorization (optional, for debugging)
      const authHeader = request.headers.get('authorization');
      const cronSecret = process.env.CRON_SECRET;
      const isAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;
      
      // Allow only Vercel Cron, GitHub Actions, or authorized requests
      if (!isVercelCron && !isGitHubAction && !isAuthorized) {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        console.warn(`🚫 Unauthorized crawler attempt from IP: ${ip}, User-Agent: ${userAgent}`);
        return NextResponse.json({ 
          error: 'Unauthorized', 
          message: 'This endpoint is only accessible via Vercel Cron or GitHub Actions' 
        }, { status: 401 });
      }
    }
    
    const source = isDevelopment ? 'Development (localhost)' :
                   request.headers.get('x-vercel-cron') === '1' ? 'Vercel Cron' : 
                   (request.headers.get('user-agent') || '').includes('GitHub') ? 'GitHub Action' : 
                   'Manual (Authorized)';
    
    console.log(`✅ Crawler triggered by: ${source}`);
    console.log("Cron job triggered: Running crawler...");
    await runCrawler();
    console.log("Cron job finished: Crawler ran successfully.");
    return NextResponse.json({ status: 'ok', message: 'Crawler executed successfully' });
  } catch (error: any) {
    console.error("Cron job failed:", error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
