const axios = require('axios');

async function analyzeStorageUsage() {
    const testIp = '192.190.136.36';

    console.log('Fetching pod statistics...\n');

    try {
        const res = await axios.post(`http://${testIp}:6000/rpc`, {
            jsonrpc: '2.0',
            method: 'get-pods-with-stats',
            id: 1
        }, { timeout: 5000 });

        const pods = res.data?.result?.pods || [];
        console.log(`Total pods found: ${pods.length}\n`);

        // Separate by active vs private (based on presence in active IPs)
        const knownActiveIPs = new Set([
            '192.190.136.36', '192.190.136.28', '192.190.136.29',
            '192.190.136.37', '192.190.136.38', '62.171.138.27',
            '173.212.203.145', '161.97.97.41', '207.244.255.1',
            '159.69.221.189', '178.18.250.133', '37.120.167.241',
            '173.249.36.181', '62.84.180.238'
        ]);

        let allCommitted = 0;
        let allUsed = 0;
        let activeCommitted = 0;
        let activeUsed = 0;
        let privateCommitted = 0;
        let privateUsed = 0;

        const activePods = [];
        const privatePods = [];

        pods.forEach(pod => {
            const ip = pod.address?.split(':')[0];
            const committed = pod.storage_committed || 0;
            const usagePercent = pod.storage_usage_percent || 0;
            const used = committed * usagePercent;

            allCommitted += committed;
            allUsed += used;

            if (knownActiveIPs.has(ip)) {
                activeCommitted += committed;
                activeUsed += used;
                if (used > 0) {
                    activePods.push({ ip, committed, usagePercent, used });
                }
            } else {
                privateCommitted += committed;
                privateUsed += used;
                if (used > 0) {
                    privatePods.push({ ip, committed, usagePercent, used });
                }
            }
        });

        console.log('=== ALL PODS ===');
        console.log(`Total committed: ${(allCommitted / 1e9).toFixed(2)} GB`);
        console.log(`Total used:      ${(allUsed / 1e9).toFixed(2)} GB`);
        console.log(`Utilization:     ${allCommitted > 0 ? ((allUsed / allCommitted) * 100).toFixed(4) : 0}%\n`);

        console.log('=== ACTIVE PODS ONLY ===');
        console.log(`Total committed: ${(activeCommitted / 1e9).toFixed(2)} GB`);
        console.log(`Total used:      ${(activeUsed / 1e9).toFixed(2)} GB`);
        console.log(`Utilization:     ${activeCommitted > 0 ? ((activeUsed / activeCommitted) * 100).toFixed(4) : 0}%\n`);

        console.log('=== PRIVATE/GOSSIP PODS ===');
        console.log(`Total committed: ${(privateCommitted / 1e9).toFixed(2)} GB`);
        console.log(`Total used:      ${(privateUsed / 1e9).toFixed(2)} GB`);
        console.log(`Utilization:     ${privateCommitted > 0 ? ((privateUsed / privateCommitted) * 100).toFixed(4) : 0}%\n`);

        // Show top pods with usage
        console.log('=== TOP 10 ACTIVE PODS WITH USAGE ===');
        activePods.sort((a, b) => b.used - a.used).slice(0, 10).forEach((pod, i) => {
            console.log(`${i + 1}. ${pod.ip}`);
            console.log(`   Committed: ${(pod.committed / 1e9).toFixed(2)} GB`);
            console.log(`   Usage %:   ${pod.usagePercent}`);
            console.log(`   Used:      ${(pod.used / 1e9).toFixed(6)} GB\n`);
        });

        console.log('=== TOP 10 PRIVATE PODS WITH USAGE ===');
        privatePods.sort((a, b) => b.used - a.used).slice(0, 10).forEach((pod, i) => {
            console.log(`${i + 1}. ${pod.ip}`);
            console.log(`   Committed: ${(pod.committed / 1e9).toFixed(2)} GB`);
            console.log(`   Usage %:   ${pod.usagePercent}`);
            console.log(`   Used:      ${(pod.used / 1e9).toFixed(6)} GB\n`);
        });

        // Check if there's a different interpretation
        console.log('\n=== ALTERNATIVE CALCULATION ===');
        console.log('Testing if storage_usage_percent is already in percentage (0-100) instead of ratio (0-1):\n');

        const altActiveUsed = activeCommitted * (activePods.reduce((sum, p) => sum + p.usagePercent, 0) / 100);
        const altAllUsed = allCommitted * (pods.reduce((sum, p) => sum + (p.storage_usage_percent || 0), 0) / 100);

        console.log(`Active used (if %):  ${(altActiveUsed / 1e9).toFixed(2)} GB`);
        console.log(`All used (if %):     ${(altAllUsed / 1e9).toFixed(2)} GB`);

    } catch (e) {
        console.error('Error:', e.message);
    }
}

analyzeStorageUsage();
