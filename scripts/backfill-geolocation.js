#!/usr/bin/env node

/**
 * Geolocation Backfill Script (Hybrid: ipwho.is + ip-api.com fallback)
 * Fetches geolocation data for all pNodes that don't have it yet
 * Run with: node scripts/backfill-geolocation.js
 * Make sure Next.js dev server is running on localhost:3000
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Simple fetch wrapper for Node.js
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${data.slice(0, 100)}`));
        }
      });
    }).on('error', reject);
  });
}

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('🌍 Geolocation Backfill Script (Hybrid Provider)');
  console.log('=================================================\n');
  console.log('📡 Using: ipwho.is (primary) + ip-api.com (fallback)\n');

  // Step 1: Fetch all pNodes from the API
  console.log('📡 Fetching all pNodes...');
  
  let pnodes;
  try {
    const response = await fetchJson('http://localhost:3000/api/pnodes?limit=1000');
    pnodes = response.data;
    console.log(`✅ Found ${pnodes.length} pNodes\n`);
  } catch (err) {
    console.error('❌ Failed to fetch pNodes. Is the dev server running?');
    console.error('   Run: npm run dev');
    console.error('   Error:', err.message);
    process.exit(1);
  }

  // Step 2: Filter nodes without geolocation
  const nodesWithoutGeo = pnodes.filter(p => !p.city || !p.country || !p.lat || !p.lng);
  console.log(`🔍 ${nodesWithoutGeo.length} nodes need geolocation\n`);

  if (nodesWithoutGeo.length === 0) {
    console.log('✨ All nodes already have geolocation data!');
    return;
  }

  // Step 3: Fetch geolocation for each node
  let success = 0;
  let failed = 0;

  for (let i = 0; i < nodesWithoutGeo.length; i++) {
    const node = nodesWithoutGeo[i];
    const progress = `[${i + 1}/${nodesWithoutGeo.length}]`;
    
    process.stdout.write(`${progress} Geolocating ${node.ip}... `);

    try {
      const geoData = await fetchJson(`http://localhost:3000/api/geolocate/${encodeURIComponent(node.ip)}`);
      
      if (geoData.success && geoData.city) {
        const flag = geoData.country_code ? getFlagEmoji(geoData.country_code) : '🌍';
        console.log(`✅ ${flag} ${geoData.city}, ${geoData.country}`);
        success++;
      } else {
        console.log(`⚠️  No data (${geoData.message || 'unknown'})`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
      failed++;
    }

    // Rate limiting: wait 1.5s between requests (ip-api.com allows 45/min = 1 every 1.33s)
    if (i < nodesWithoutGeo.length - 1) {
      await delay(1500);
    }
  }

  // Summary
  console.log('\n=================================================');
  console.log('📊 Summary:');
  console.log(`   ✅ Successfully geolocated: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('=================================================\n');

  if (success > 0) {
    console.log('💡 Refresh your dashboard to see the updated locations!');
  }
}

// Helper to convert country code to flag emoji
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
