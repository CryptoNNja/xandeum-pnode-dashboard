const axios = require('axios');

async function testCorrectedCalc() {
    const testIp = '192.190.136.36';

    console.log('Testing corrected calculation (dividing by 100 when > 1)...\n');

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

        let allCommitted = 0;
        let allUsed = 0;
        let activeCommitted = 0;
        let activeUsed = 0;

        pods.forEach(pod => {
            const ip = pod.address?.split(':')[0];

            // Skip localhost
            if (ip === '127.0.0.1' || ip === 'localhost') {
                return;
            }

            const committed = pod.storage_committed || 0;
            let usagePercent = pod.storage_usage_percent || 0;

            // CORRECTION: Normalize to ratio (0-1)
            if (usagePercent > 1) {
                usagePercent = usagePercent / 100;
            }

            const used = committed * usagePercent;

            allCommitted += committed;
            allUsed += used;

            if (activeIps.has(ip)) {
                activeCommitted += committed;
                activeUsed += used;
            }
        });

        console.log('=== WITH CORRECTED CALCULATION ===');
        console.log(`All pods (no localhost):`);
        console.log(`  Committed: ${(allCommitted / 1e9).toFixed(2)} GB`);
        console.log(`  Used:      ${(allUsed / 1e9).toFixed(2)} GB\n`);

        console.log(`Active pods only:`);
        console.log(`  Committed: ${(activeCommitted / 1e9).toFixed(2)} GB`);
        console.log(`  Used:      ${(activeUsed / 1e9).toFixed(2)} GB\n`);

        if (Math.abs(allUsed / 1e9 - 4.66) < 0.5) {
            console.log(`✅ CLOSE TO 4.66 GB! All pods used = ${(allUsed / 1e9).toFixed(2)} GB`);
        } else {
            console.log(`❌ Still not matching. Expected ~4.66 GB, got ${(allUsed / 1e9).toFixed(2)} GB`);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

testCorrectedCalc();
