const axios = require('axios');

async function inspectAPIFields() {
    const testIp = '192.190.136.36';

    console.log('Inspecting ALL fields returned by get-pods-with-stats...\n');

    try {
        const res = await axios.post(`http://${testIp}:6000/rpc`, {
            jsonrpc: '2.0',
            method: 'get-pods-with-stats',
            id: 1
        }, { timeout: 5000 });

        const pods = res.data?.result?.pods || [];

        if (pods.length > 0) {
            console.log('=== Sample pod (first one) - ALL FIELDS ===');
            console.log(JSON.stringify(pods[0], null, 2));
            console.log('\n');

            // Check if there's a direct storage_used field
            let totalStorageUsedDirect = 0;
            let podsWithStorageUsed = 0;

            pods.forEach(pod => {
                const ip = pod.address?.split(':')[0];

                // Skip localhost
                if (ip === '127.0.0.1' || ip === 'localhost') {
                    return;
                }

                // Check for storage_used field
                if (pod.storage_used !== undefined && pod.storage_used !== null) {
                    totalStorageUsedDirect += (pod.storage_used || 0);
                    podsWithStorageUsed++;
                }
            });

            console.log('=== Checking for direct storage_used field ===');
            console.log(`Pods with storage_used field: ${podsWithStorageUsed}`);
            console.log(`Total storage_used (direct): ${(totalStorageUsedDirect / 1e9).toFixed(2)} GB\n`);

            // Also check ALL possible storage-related fields
            console.log('=== All unique fields found in pods ===');
            const allFields = new Set();
            pods.forEach(pod => {
                Object.keys(pod).forEach(key => allFields.add(key));
            });
            console.log(Array.from(allFields).sort().join(', '));

        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

inspectAPIFields();
