import axios from 'axios';

async function testGetPodsWithStats() {
  const testIp = '192.190.136.36'; // Un des bootstrap nodes

  try {
    console.log(`🔍 Calling get-pods-with-stats on ${testIp}...\n`);

    const response = await axios.post(
      `http://${testIp}:6000/rpc`,
      { jsonrpc: "2.0", method: "get-pods-with-stats", id: 1 },
      { timeout: 5000 }
    );

    const pods = response.data?.result?.pods || [];

    console.log(`Found ${pods.length} pods\n`);

    // Show first 3 pods with ALL fields
    pods.slice(0, 3).forEach((pod: any, i: number) => {
      console.log(`\n=== Pod ${i + 1} ===`);
      console.log(JSON.stringify(pod, null, 2));
    });

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

testGetPodsWithStats();
