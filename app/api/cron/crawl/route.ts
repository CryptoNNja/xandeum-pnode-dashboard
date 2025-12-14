import { NextResponse } from 'next/server';
import { main as runCrawler } from '../../../../scripts/crawler'; // Adjust path as needed

export async function GET() {
  try {
    console.log("Cron job triggered: Running crawler...");
    await runCrawler();
    console.log("Cron job finished: Crawler ran successfully.");
    return NextResponse.json({ status: 'ok', message: 'Crawler executed successfully' });
  } catch (error: any) {
    console.error("Cron job failed:", error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
