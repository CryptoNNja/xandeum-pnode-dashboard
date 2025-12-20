import axios from 'axios';

async function testGetStatsResponse() {
  const testIp = '192.190.136.36'; // Bootstrap node

  try {
    console.log(`🔍 Testing get-stats on ${testIp}...\n`);

    const response = await axios.post(
      `http://${testIp}:6000/rpc`,
      { jsonrpc: "2.0", method: "get-stats", id: 1 },
      { timeout: 5000 }
    );

    console.log('📊 Response from get-stats:');
    console.log(JSON.stringify(response.data, null, 2));

    const stats = response.data?.result;
    if (stats && 'storage_committed' in stats) {
      console.log(`\n⚠️  get-stats includes storage_committed: ${stats.storage_committed}`);
      console.log(`   This might be overriding our enrichment!`);
    } else {
      console.log(`\n✅ get-stats does NOT include storage_committed`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

testGetStatsResponse();
