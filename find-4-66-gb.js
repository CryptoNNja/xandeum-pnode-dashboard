const axios = require('axios');

async function find4_66GB() {
    const testIp = '192.190.136.36';

    console.log('Searching for the 4.66 GB metric...\n');

    // Test 1: Check get-stats for all active nodes
    console.log('=== TEST 1: Summing total_bytes from get-stats (active nodes) ===');
    const activeIps = [
        '192.190.136.36', '192.190.136.28', '192.190.136.29',
        '192.190.136.37', '192.190.136.38', '62.171.138.27',
        '173.212.203.145', '161.97.97.41', '207.244.255.1',
        '159.69.221.189', '178.18.250.133', '37.120.167.241'
    ];

    let totalBytesSum = 0;
    let fileSizeSum = 0;

    for (const ip of activeIps) {
        try {
            const res = await axios.post(`http://${ip}:6000/rpc`, {
                jsonrpc: '2.0',
                method: 'get-stats',
                id: 1
            }, { timeout: 2000 });

            const stats = res.data?.result;
            if (stats) {
                totalBytesSum += (stats.total_bytes || 0);
                fileSizeSum += (stats.file_size || 0);
            }
        } catch (e) {
            // Skip failed nodes
        }
    }

    console.log(`Total total_bytes: ${(totalBytesSum / 1e9).toFixed(2)} GB`);
    console.log(`Total file_size: ${(fileSizeSum / 1e9).toFixed(2)} GB\n`);

    // Test 2: Check get-pods-with-stats WITHOUT localhost
    console.log('=== TEST 2: Storage used from get-pods-with-stats (no localhost) ===');

    try {
        const res = await axios.post(`http://${testIp}:6000/rpc`, {
            jsonrpc: '2.0',
            method: 'get-pods-with-stats',
            id: 1
        }, { timeout: 5000 });

        const pods = res.data?.result?.pods || [];

        let allUsed = 0;
        let allCommitted = 0;
        let activeUsed = 0;
        let activeCommitted = 0;

        const activeSet = new Set(activeIps);

        pods.forEach(pod => {
            const ip = pod.address?.split(':')[0];

            // Skip localhost
            if (ip === '127.0.0.1' || ip === 'localhost') {
                return;
            }

            const committed = pod.storage_committed || 0;
            const usagePercent = pod.storage_usage_percent || 0;
            const used = committed * usagePercent;

            allUsed += used;
            allCommitted += committed;

            if (activeSet.has(ip)) {
                activeUsed += used;
                activeCommitted += committed;
            }
        });

        console.log(`All pods (no localhost):`);
        console.log(`  Committed: ${(allCommitted / 1e9).toFixed(2)} GB`);
        console.log(`  Used:      ${(allUsed / 1e9).toFixed(2)} GB`);
        console.log(`  (This should be ~0.22 GB without localhost)\n`);

        console.log(`Active pods only:`);
        console.log(`  Committed: ${(activeCommitted / 1e9).toFixed(2)} GB`);
        console.log(`  Used:      ${(activeUsed / 1e9).toFixed(2)} GB\n`);

        // Test 3: Maybe they're showing committed storage for active nodes?
        console.log('=== TEST 3: Alternative interpretations ===');
        console.log(`Active committed / 1000: ${(activeCommitted / 1000).toFixed(2)} GB`);
        console.log(`Active committed * 0.001: ${(activeCommitted * 0.001).toFixed(2)} GB`);
        console.log(`All used * 10: ${(allUsed * 10 / 1e9).toFixed(2)} GB`);
        console.log(`Active used * 1000: ${(activeUsed * 1000 / 1e9).toFixed(2)} GB\n`);

        // Test 4: Find any combination that gives ~4.66 GB
        console.log('=== TEST 4: Looking for ~4.66 GB ===');

        const targetGB = 4.66;
        const targetBytes = targetGB * 1e9;
        const tolerance = 0.1 * 1e9; // 100 MB tolerance

        if (Math.abs(allUsed - targetBytes) < tolerance) {
            console.log(`✓ MATCH: All pods used (no localhost) = ${(allUsed / 1e9).toFixed(2)} GB`);
        }
        if (Math.abs(activeUsed - targetBytes) < tolerance) {
            console.log(`✓ MATCH: Active pods used = ${(activeUsed / 1e9).toFixed(2)} GB`);
        }
        if (Math.abs(allCommitted / 1000 - targetBytes) < tolerance) {
            console.log(`✓ MATCH: All committed / 1000 = ${(allCommitted / 1000 / 1e9).toFixed(2)} GB`);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

find4_66GB();
