const axios = require('axios');

async function testAPIs() {
    const testIp = '192.190.136.36';

    console.log('Testing get-stats API...\n');
    try {
        const statsRes = await axios.post(`http://${testIp}:6000/rpc`, {
            jsonrpc: '2.0',
            method: 'get-stats',
            id: 1
        }, { timeout: 5000 });

        const stats = statsRes.data?.result;
        console.log('get-stats result:');
        console.log('  total_bytes:', stats?.total_bytes);
        console.log('  file_size:', stats?.file_size);
        console.log('  total_pages:', stats?.total_pages);
        console.log('');
    } catch (e) {
        console.log('Error calling get-stats:', e.message);
    }

    console.log('Testing get-pods-with-stats API...\n');
    try {
        const podsRes = await axios.post(`http://${testIp}:6000/rpc`, {
            jsonrpc: '2.0',
            method: 'get-pods-with-stats',
            id: 1
        }, { timeout: 5000 });

        const pods = podsRes.data?.result?.pods || [];
        console.log(`Found ${pods.length} pods`);

        // Calculate totals
        let totalCommitted = 0;
        let totalUsedCalc = 0;
        let totalBytes = 0;

        pods.forEach(pod => {
            const committed = pod.storage_committed || 0;
            const usagePercent = pod.storage_usage_percent || 0;
            const used = committed * usagePercent;

            totalCommitted += committed;
            totalUsedCalc += used;

            // Check if pod has total_bytes field
            if (pod.total_bytes !== undefined) {
                totalBytes += (pod.total_bytes || 0);
            }
        });

        console.log('\nAggregated from all pods:');
        console.log('  Total storage_committed:', (totalCommitted / 1e9).toFixed(2), 'GB');
        console.log('  Total storage_used (calculated):', (totalUsedCalc / 1e9).toFixed(2), 'GB');
        if (totalBytes > 0) {
            console.log('  Total total_bytes:', (totalBytes / 1e9).toFixed(2), 'GB');
        }

        console.log('\nSample pod (first 3):');
        pods.slice(0, 3).forEach((pod, i) => {
            console.log(`  Pod ${i + 1}:`, pod.address);
            console.log('    storage_committed:', (pod.storage_committed || 0) / 1e9, 'GB');
            console.log('    storage_usage_percent:', pod.storage_usage_percent);
            console.log('    calculated used:', ((pod.storage_committed || 0) * (pod.storage_usage_percent || 0)) / 1e9, 'GB');
        });

    } catch (e) {
        console.log('Error calling get-pods-with-stats:', e.message);
    }
}

testAPIs();
