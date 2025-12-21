const axios = require('axios');

async function calculateAveragePerPod() {
    const testIp = '192.190.136.36';

    console.log('Calculating average committed storage per pod...\n');

    try {
        const res = await axios.post(`http://${testIp}:6000/rpc`, {
            jsonrpc: '2.0',
            method: 'get-pods-with-stats',
            id: 1
        }, { timeout: 5000 });

        const pods = res.data?.result?.pods || [];

        let totalCommitted = 0;
        let podCount = 0;

        pods.forEach(pod => {
            const ip = pod.address?.split(':')[0];

            // Skip localhost
            if (ip === '127.0.0.1' || ip === 'localhost') {
                return;
            }

            const committed = pod.storage_committed || 0;
            if (committed > 0) {
                totalCommitted += committed;
                podCount++;
            }
        });

        const avgPerPod = podCount > 0 ? totalCommitted / podCount : 0;

        console.log('=== AVERAGE STORAGE COMMITTED PER POD ===');
        console.log(`Total pods (no localhost): ${podCount}`);
        console.log(`Total committed: ${(totalCommitted / 1e9).toFixed(2)} GB (${(totalCommitted / 1e12).toFixed(2)} TB)`);
        console.log(`Average per pod: ${(avgPerPod / 1e9).toFixed(2)} GB`);
        console.log(`Average per pod: ${(avgPerPod / 1e12).toFixed(2)} TB\n`);

        // Test if this matches 4.66 GB
        if (Math.abs(avgPerPod / 1e9 - 4.66) < 0.5) {
            console.log('✅ MATCH! Average committed per pod = 4.66 GB');
        } else {
            console.log(`❌ Not matching. Expected ~4.66 GB, got ${(avgPerPod / 1e9).toFixed(2)} GB`);
        }

        // Also try average used per pod
        let totalUsed = 0;
        let podsWithUsed = 0;

        pods.forEach(pod => {
            const ip = pod.address?.split(':')[0];
            if (ip === '127.0.0.1' || ip === 'localhost') return;

            const used = pod.storage_used || 0;
            if (used > 0) {
                totalUsed += used;
                podsWithUsed++;
            }
        });

        const avgUsedPerPod = podsWithUsed > 0 ? totalUsed / podsWithUsed : 0;

        console.log('\n=== AVERAGE STORAGE USED PER POD ===');
        console.log(`Pods with used > 0: ${podsWithUsed}`);
        console.log(`Total used: ${(totalUsed / 1e9).toFixed(6)} GB (${(totalUsed / 1e6).toFixed(2)} MB)`);
        console.log(`Average used per pod: ${(avgUsedPerPod / 1e6).toFixed(2)} MB`);

    } catch (e) {
        console.error('Error:', e.message);
    }
}

calculateAveragePerPod();
