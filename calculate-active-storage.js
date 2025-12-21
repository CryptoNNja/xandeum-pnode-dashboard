const axios = require('axios');

async function calculateActiveStorage() {
    // Get list of active nodes (nodes that respond to get-stats)
    const testNodes = [
        '192.190.136.36', '192.190.136.28', '192.190.136.29',
        '192.190.136.37', '192.190.136.38', '62.171.138.27',
        '173.212.203.145', '161.97.97.41', '207.244.255.1'
    ];

    console.log('Testing storage metrics for active nodes...\n');

    let totalBytesSum = 0;
    let activeCount = 0;
    const results = [];

    for (const ip of testNodes) {
        try {
            const res = await axios.post(`http://${ip}:6000/rpc`, {
                jsonrpc: '2.0',
                method: 'get-stats',
                id: 1
            }, { timeout: 3000 });

            const stats = res.data?.result;
            if (stats) {
                const totalBytes = stats.total_bytes || 0;
                const fileSize = stats.file_size || 0;
                const totalPages = stats.total_pages || 0;

                results.push({
                    ip,
                    total_bytes: totalBytes,
                    file_size: fileSize,
                    total_pages: totalPages
                });

                totalBytesSum += totalBytes;
                activeCount++;

                console.log(`${ip}:`);
                console.log(`  total_bytes: ${(totalBytes / 1e9).toFixed(4)} GB`);
                console.log(`  file_size: ${(fileSize / 1e9).toFixed(4)} GB`);
                console.log(`  total_pages: ${totalPages}`);
                console.log('');
            }
        } catch (e) {
            console.log(`${ip}: FAILED (${e.message})`);
        }
    }

    console.log('\n========================================');
    console.log(`Total active nodes tested: ${activeCount}`);
    console.log(`Total storage used (total_bytes): ${(totalBytesSum / 1e9).toFixed(2)} GB`);
    console.log(`Average per node: ${activeCount > 0 ? (totalBytesSum / activeCount / 1e9).toFixed(4) : 0} GB`);
    console.log('========================================\n');

    // Also check what get-pods-with-stats returns for comparison
    console.log('Comparing with get-pods-with-stats for active nodes only...\n');
    try {
        const podsRes = await axios.post(`http://${testNodes[0]}:6000/rpc`, {
            jsonrpc: '2.0',
            method: 'get-pods-with-stats',
            id: 1
        }, { timeout: 5000 });

        const pods = podsRes.data?.result?.pods || [];

        // Filter to only active nodes (those we could query with get-stats)
        let activePodsCommitted = 0;
        let activePodsUsed = 0;

        pods.forEach(pod => {
            const podIp = pod.address?.split(':')[0];
            if (results.some(r => r.ip === podIp)) {
                const committed = pod.storage_committed || 0;
                const usagePercent = pod.storage_usage_percent || 0;
                activePodsCommitted += committed;
                activePodsUsed += committed * usagePercent;
            }
        });

        console.log(`Active pods storage_committed: ${(activePodsCommitted / 1e9).toFixed(2)} GB`);
        console.log(`Active pods storage_used (calc): ${(activePodsUsed / 1e9).toFixed(2)} GB`);

    } catch (e) {
        console.log('Error:', e.message);
    }
}

calculateActiveStorage();
