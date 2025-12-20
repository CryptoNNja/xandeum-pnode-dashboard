import axios from 'axios';

async function testTotalStorage() {
  const testIp = '192.190.136.36'; // Bootstrap node

  try {
    console.log(`🔍 Calling get-pods-with-stats on ${testIp}...\n`);

    const response = await axios.post(
      `http://${testIp}:6000/rpc`,
      { jsonrpc: "2.0", method: "get-pods-with-stats", id: 1 },
      { timeout: 5000 }
    );

    const pods = response.data?.result?.pods || [];
    console.log(`Found ${pods.length} pods\n`);

    let totalStorageBytes = 0;
    let podCount = 0;
    const uniqueIps = new Set<string>();

    pods.forEach((pod: any) => {
      const storage = pod.storage_committed || 0;
      totalStorageBytes += storage;
      podCount++;

      // Extract IP from address (format: "ip:port")
      const ip = pod.address?.split(':')[0];
      if (ip) {
        uniqueIps.add(ip);
      }
    });

    const totalTB = totalStorageBytes / (1024 ** 4);
    const totalGB = totalStorageBytes / (1024 ** 3);
    const avgGB = totalGB / podCount;

    console.log(`📊 Results:`);
    console.log(`  Total pods: ${podCount}`);
    console.log(`  Unique IPs: ${uniqueIps.size}`);
    console.log(`  Total storage (raw bytes): ${totalStorageBytes}`);
    console.log(`  Total storage: ${totalTB.toFixed(2)} TB`);
    console.log(`  Total storage: ${totalGB.toFixed(2)} GB`);
    console.log(`  Average per pod: ${avgGB.toFixed(2)} GB`);
    console.log(`  Expected (official): 176.68 TB total, 790 GB/node`);

    // Check if IPs appear multiple times
    const ipCounts = new Map<string, number>();
    pods.forEach((pod: any) => {
      const ip = pod.address?.split(':')[0];
      if (ip) {
        ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
      }
    });

    const multiPodIps = Array.from(ipCounts.entries()).filter(([_, count]) => count > 1);
    if (multiPodIps.length > 0) {
      console.log(`\n⚠️  Found ${multiPodIps.length} IPs with multiple pods:`);
      multiPodIps.slice(0, 5).forEach(([ip, count]) => {
        console.log(`  ${ip}: ${count} pods`);
      });
    } else {
      console.log(`\n✅ Each IP has exactly 1 pod`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

testTotalStorage();
