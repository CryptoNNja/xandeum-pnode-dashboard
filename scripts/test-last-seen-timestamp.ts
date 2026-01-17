import axios from 'axios';

/**
 * Test script to verify last_seen_timestamp is properly captured from get-pods-with-stats API
 */
async function testLastSeenTimestamp() {
  const testNodes = [
    '192.190.136.36', // Bootstrap node 1
    '161.97.97.41',   // Bootstrap node 2
    '173.212.203.145' // Bootstrap node 3
  ];

  console.log('🧪 Testing last_seen_timestamp capture from get-pods-with-stats API\n');

  for (const ip of testNodes) {
    try {
      console.log(`📡 Querying ${ip}:6000...`);
      
      const response = await axios.post(
        `http://${ip}:6000/rpc`,
        { jsonrpc: "2.0", method: "get-pods-with-stats", id: 1 },
        { timeout: 5000 }
      );

      const pods = response.data?.result?.pods || [];
      console.log(`   ✅ Received ${pods.length} pods\n`);

      if (pods.length > 0) {
        // Show first 3 pods with last_seen_timestamp info
        console.log('   Sample pods with last_seen_timestamp:');
        pods.slice(0, 3).forEach((pod: any, i: number) => {
          const address = pod.address || 'N/A';
          const lastSeen = pod.last_seen_timestamp;
          const hasLastSeen = lastSeen !== undefined && lastSeen !== null;
          
          console.log(`   \n   Pod ${i + 1}:`);
          console.log(`     Address: ${address}`);
          console.log(`     Pubkey: ${pod.pubkey ? `${pod.pubkey.slice(0, 8)}...` : 'N/A'}`);
          console.log(`     Version: ${pod.version || 'N/A'}`);
          console.log(`     last_seen_timestamp: ${hasLastSeen ? lastSeen : '❌ MISSING'}`);
          
          if (hasLastSeen) {
            const date = new Date(lastSeen * 1000);
            const now = Date.now() / 1000;
            const ageSeconds = now - lastSeen;
            const ageMinutes = Math.floor(ageSeconds / 60);
            const ageHours = Math.floor(ageMinutes / 60);
            
            console.log(`       → Date: ${date.toISOString()}`);
            console.log(`       → Age: ${ageHours}h ${ageMinutes % 60}m ago`);
          }
        });
        
        // Statistics
        const podsWithLastSeen = pods.filter((p: any) => p.last_seen_timestamp !== undefined && p.last_seen_timestamp !== null);
        const percentage = ((podsWithLastSeen.length / pods.length) * 100).toFixed(1);
        
        console.log(`\n   📊 Statistics:`);
        console.log(`     Pods with last_seen_timestamp: ${podsWithLastSeen.length}/${pods.length} (${percentage}%)`);
        
        if (podsWithLastSeen.length === 0) {
          console.log(`     ⚠️  WARNING: No pods have last_seen_timestamp field!`);
        } else if (podsWithLastSeen.length < pods.length) {
          console.log(`     ⚠️  Some pods are missing last_seen_timestamp`);
        } else {
          console.log(`     ✅ All pods have last_seen_timestamp!`);
        }
      }
      
      console.log('\n' + '─'.repeat(80) + '\n');
      
    } catch (error: any) {
      console.error(`   ❌ Error querying ${ip}: ${error.message}\n`);
    }
  }

  console.log('✅ Test complete!');
}

testLastSeenTimestamp();
