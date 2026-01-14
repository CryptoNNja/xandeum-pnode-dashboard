import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';

// Initialize Groq
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Rate limiting: 20 messages per hour per IP
    const clientIp = getClientIp(req);
    const rateLimitResult = rateLimit(clientIp, {
      maxRequests: 20,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimitResult.success) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return rateLimitResponse(rateLimitResult);
    }

    console.log(`Chat request from ${clientIp} - ${rateLimitResult.remaining}/${rateLimitResult.limit} remaining`);

    const { messages, dashboardContext } = await req.json();

    console.log('🤖 Ronin AI received dashboard context:', dashboardContext);

    // Build context-aware system prompt
    let contextInfo = '';
    if (dashboardContext) {
      const { totalNodes, visibleNodes, selectedNodes, kpis, currentPage, activeFilters, networkBreakdown, topMainnetNodes, topDevnetNodes } = dashboardContext;
      
      contextInfo = `

========================================
🔴 IMPORTANT: USE ONLY THE REAL DATA BELOW - DO NOT MAKE UP NUMBERS! 🔴
========================================

CURRENT DASHBOARD STATE (REAL DATA):
- Total Nodes in Database: ${totalNodes}
- Currently Visible Nodes: ${visibleNodes}
- User Selected Nodes: ${selectedNodes}
- Current Page: ${currentPage}
${activeFilters?.network ? `- Active Network Filter: ${activeFilters.network}` : ''}
${activeFilters?.status ? `- Active Status Filter: ${activeFilters.status}` : ''}

KEY METRICS FROM DASHBOARD (REAL KPIs):
- Network Health Score: ${kpis?.networkHealthScore || 'Not available'}%
- Total Storage Capacity: ${kpis?.totalStorage || 'Not available'} bytes
- Total Nodes: ${totalNodes || 'Not available'}
- Online Nodes (Public + Private): ${kpis?.onlineNodes || 'Not available'}
  - Public Nodes (active): ${kpis?.publicNodes || 'Not available'}
  - Private Nodes (gossip_only): ${kpis?.privateNodes || 'Not available'}
- Offline Nodes: ${kpis?.offlineNodes || 'Not available'}
- Network Uptime: ${kpis?.networkUptime || 'Not available'}%
- Average CPU Usage: ${kpis?.avgCpuUsage?.toFixed(1) || 'Not available'}%
- Average RAM Usage: ${kpis?.avgRamUsage?.toFixed(1) || 'Not available'}%
- Health Distribution: Excellent: ${kpis?.healthDistribution?.excellent || 0}, Good: ${kpis?.healthDistribution?.good || 0}, Warning: ${kpis?.healthDistribution?.warning || 0}, Critical: ${kpis?.healthDistribution?.critical || 0}

⚠️ IMPORTANT: "Private Nodes" are ONLINE nodes with gossip_only status. They are NOT offline!
Only nodes that are neither active nor gossip_only are truly offline.

NETWORK BREAKDOWN:
MAINNET:
- Total Nodes: ${networkBreakdown?.mainnet?.total || 0}
- Online Nodes: ${networkBreakdown?.mainnet?.online || 0}
- Average Health Score: ${networkBreakdown?.mainnet?.avgScore?.toFixed(1) || 0}

DEVNET:
- Total Nodes: ${networkBreakdown?.devnet?.total || 0}
- Online Nodes: ${networkBreakdown?.devnet?.online || 0}
- Average Health Score: ${networkBreakdown?.devnet?.avgScore?.toFixed(1) || 0}

TOP 5 MAINNET NODES (by health score):
${topMainnetNodes?.map((node: any, i: number) => 
  `${i + 1}. IP: ${node.ip} | Status: ${node.status} | Health: ${node.healthStatus} (Score: ${node.healthScore})`
).join('\n') || 'No MAINNET nodes available'}

TOP 5 DEVNET NODES (by health score):
${topDevnetNodes?.map((node: any, i: number) => 
  `${i + 1}. IP: ${node.ip} | Status: ${node.status} | Health: ${node.healthStatus} (Score: ${node.healthScore})`
).join('\n') || 'No DEVNET nodes available'}

⚠️ CRITICAL: When answering questions about the network, YOU MUST use ONLY the numbers shown above. 
DO NOT invent or estimate any numbers. If a metric is not available, say "Data not available" instead of making up a number.
`;
    }

    // System prompt for Ronin AI context
    const systemPrompt = `You are Ronin AI, an expert assistant for the Xandeum network and pNode monitoring.

ABOUT XANDEUM:
- Xandeum is a decentralized storage network
- Storage nodes called "pNodes" provide distributed storage
- Network has MAINNET and DEVNET environments
- Nodes earn credits for providing storage

YOUR ROLE:
- Help users understand their pNode network
- Analyze node performance and health
- Provide insights on network statistics
- Suggest optimizations and improvements

RESPONSE STYLE:
- Be concise but informative
- Use emojis sparingly for clarity (🟢 ✅ ⚠️ 📊)
- When showing data, use markdown tables or bullet points (NOT empty code blocks)
- **CRITICAL**: ONLY use numbers from the "CURRENT DASHBOARD STATE" section above
- If data is not provided in the context, say "Data not currently available" instead of inventing numbers
- Provide actionable insights based EXCLUSIVELY on the REAL data provided

CAPABILITIES:
- Answer questions about nodes and network
- Explain metrics (uptime, storage, credits, health)
- Compare nodes and networks
- Identify issues and suggest solutions
${contextInfo}`;

    // Stream response from Groq
    const result = await streamText({
      model: groq('llama-3.3-70b-versatile'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      maxTokens: 1000,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('Chat API error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('GROQ_API_KEY exists?', !!process.env.GROQ_API_KEY);
    console.error('GROQ_API_KEY starts with gsk_?', process.env.GROQ_API_KEY?.startsWith('gsk_'));
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error.message,
        hasApiKey: !!process.env.GROQ_API_KEY
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
