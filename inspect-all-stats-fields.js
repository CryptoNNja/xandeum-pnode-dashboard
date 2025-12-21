const axios = require('axios');

async function inspectAllStatsFields() {
    const testIp = '192.190.136.36';

    console.log('=== Inspecting ALL fields from get-stats ===\n');

    try {
        const res = await axios.post(`http://${testIp}:6000/rpc`, {
            jsonrpc: '2.0',
            method: 'get-stats',
            id: 1
        }, { timeout: 5000 });

        const stats = res.data?.result;

        console.log('Complete get-stats response for', testIp, ':\n');
        console.log(JSON.stringify(stats, null, 2));
        console.log('\n');

        // Check ALL fields
        console.log('=== All available fields ===');
        if (stats) {
            Object.keys(stats).forEach(key => {
                const value = stats[key];
                if (typeof value === 'number' && value > 1e6) {
                    console.log(`${key}: ${value.toLocaleString()} (${(value / 1e9).toFixed(2)} GB)`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            });
        }

        console.log('\n=== Comparing file_size vs total_bytes ===');
        console.log('file_size:', (stats?.file_size / 1e9).toFixed(2), 'GB');
        console.log('total_bytes:', (stats?.total_bytes / 1e9).toFixed(6), 'GB');
        console.log('Ratio (file_size / total_bytes):', stats?.file_size > 0 && stats?.total_bytes > 0
            ? (stats.file_size / stats.total_bytes).toFixed(0)
            : 'N/A');

    } catch (e) {
        console.error('Error:', e.message);
    }

    // Now check if maybe we should use file_size instead
    console.log('\n=== Testing: Should we use file_size as "Storage Used"? ===');

    try {
        const podsRes = await axios.post(`http://${testIp}:6000/rpc`, {
            jsonrpc: '2.0',
            method: 'get-pods-with-stats',
            id: 1
        }, { timeout: 5000 });

        const pods = podsRes.data?.result?.pods || [];

        let totalFileSize = 0;
        let totalStorageUsed = 0;
        let totalStorageCommitted = 0;
        let podCount = 0;

        pods.forEach(pod => {
            const ip = pod.address?.split(':')[0];
            if (ip === '127.0.0.1' || ip === 'localhost') return;

            totalStorageCommitted += (pod.storage_committed || 0);
            totalStorageUsed += (pod.storage_used || 0);
            podCount++;
        });

        console.log(`Total pods: ${podCount}`);
        console.log(`Total storage_committed: ${(totalStorageCommitted / 1e9).toFixed(2)} GB`);
        console.log(`Total storage_used (API field): ${(totalStorageUsed / 1e9).toFixed(6)} GB`);
        console.log(`Total storage_used (API field): ${(totalStorageUsed / 1e6).toFixed(2)} MB\n`);

        // Maybe we should use storage_committed as "used"?
        console.log('If we use storage_committed / some divisor:');
        console.log(`  / 1000: ${(totalStorageCommitted / 1000 / 1e9).toFixed(2)} GB`);
        console.log(`  / 41667: ${(totalStorageCommitted / 41667 / 1e9).toFixed(2)} GB (to get 4.66 GB)`);

    } catch (e) {
        console.error('Error:', e.message);
    }
}

inspectAllStatsFields();
