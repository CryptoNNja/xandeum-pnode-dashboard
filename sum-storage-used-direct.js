const axios = require('axios');

async function sumStorageUsedDirect() {
    const testIp = '192.190.136.36';

    console.log('Summing storage_used field directly from API...\n');

    try {
        const res = await axios.post(`http://${testIp}:6000/rpc`, {
            jsonrpc: '2.0',
            method: 'get-pods-with-stats',
            id: 1
        }, { timeout: 5000 });

        const pods = res.data?.result?.pods || [];

        const activeIps = new Set([
            '192.190.136.36', '192.190.136.28', '192.190.136.29',
            '192.190.136.37', '192.190.136.38', '62.171.138.27',
            '173.212.203.145', '161.97.97.41', '207.244.255.1',
            '159.69.221.189', '178.18.250.133', '37.120.167.241'
        ]);

        let allUsed = 0;
        let activeUsed = 0;
        const topPods = [];

        pods.forEach(pod => {
            const ip = pod.address?.split(':')[0];

            // Skip localhost
            if (ip === '127.0.0.1' || ip === 'localhost') {
                return;
            }

            const used = pod.storage_used || 0;
            allUsed += used;

            if (activeIps.has(ip)) {
                activeUsed += used;
            }

            if (used > 0) {
                topPods.push({
                    ip,
                    used,
                    committed: pod.storage_committed || 0
                });
            }
        });

        console.log('=== USING DIRECT storage_used FIELD ===');
        console.log(`All pods (no localhost):`);
        console.log(`  Total storage_used: ${(allUsed / 1e9).toFixed(2)} GB`);
        console.log(`  Total storage_used: ${(allUsed / 1e6).toFixed(2)} MB`);
        console.log(`  Total storage_used: ${allUsed.toLocaleString()} bytes\n`);

        console.log(`Active pods only:`);
        console.log(`  Total storage_used: ${(activeUsed / 1e9).toFixed(2)} GB`);
        console.log(`  Total storage_used: ${(activeUsed / 1e6).toFixed(2)} MB\n`);

        // Check if close to 4.66 GB
        const targetGB = 4.66;
        if (Math.abs(allUsed / 1e9 - targetGB) < 0.5) {
            console.log(`✅ MATCH! All pods storage_used ≈ ${targetGB} GB`);
        } else if (Math.abs(activeUsed / 1e9 - targetGB) < 0.5) {
            console.log(`✅ MATCH! Active pods storage_used ≈ ${targetGB} GB`);
        } else {
            console.log(`❌ No match. Expected ~${targetGB} GB`);
            console.log(`   Difference: ${Math.abs(allUsed / 1e9 - targetGB).toFixed(2)} GB\n`);
        }

        // Show top pods
        topPods.sort((a, b) => b.used - a.used);
        console.log('=== Top 10 pods by storage_used ===');
        topPods.slice(0, 10).forEach((pod, i) => {
            console.log(`${i + 1}. ${pod.ip}: ${(pod.used / 1e6).toFixed(2)} MB (${(pod.used / 1e9).toFixed(6)} GB)`);
        });

    } catch (e) {
        console.error('Error:', e.message);
    }
}

sumStorageUsedDirect();
