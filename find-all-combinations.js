const axios = require('axios');

async function findAllCombinations() {
    const testIp = '192.190.136.36';

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

        let metrics = {
            all_storage_committed: 0,
            all_storage_used: 0,
            active_storage_committed: 0,
            active_storage_used: 0,
            all_calc_used_percent: 0,
            active_calc_used_percent: 0,
        };

        pods.forEach(pod => {
            const ip = pod.address?.split(':')[0];
            if (ip === '127.0.0.1' || ip === 'localhost') return;

            const committed = pod.storage_committed || 0;
            const used = pod.storage_used || 0;
            let usagePercent = pod.storage_usage_percent || 0;

            if (usagePercent > 1) usagePercent /= 100;
            const calcUsed = committed * usagePercent;

            metrics.all_storage_committed += committed;
            metrics.all_storage_used += used;
            metrics.all_calc_used_percent += calcUsed;

            if (activeIps.has(ip)) {
                metrics.active_storage_committed += committed;
                metrics.active_storage_used += used;
                metrics.active_calc_used_percent += calcUsed;
            }
        });

        console.log('Testing ALL possible interpretations for 4.66 GB:\n');

        const targetGB = 4.66;
        const tests = [
            { name: 'All storage_committed', value: metrics.all_storage_committed / 1e9 },
            { name: 'All storage_committed / 1000', value: metrics.all_storage_committed / 1e12 },
            { name: 'All storage_used (direct)', value: metrics.all_storage_used / 1e9 },
            { name: 'All storage_used (direct) * 1000', value: metrics.all_storage_used / 1e6 },
            { name: 'All calc from percent', value: metrics.all_calc_used_percent / 1e9 },
            { name: 'Active storage_committed', value: metrics.active_storage_committed / 1e9 },
            { name: 'Active storage_committed / 1000', value: metrics.active_storage_committed / 1e12 },
            { name: 'Active storage_used (direct)', value: metrics.active_storage_used / 1e9 },
            { name: 'Active storage_used (direct) * 1000', value: metrics.active_storage_used / 1e6 },
            { name: 'Active storage_used * 2137', value: (metrics.active_storage_used / 1e9) * 2137 },
            { name: 'Active calc from percent', value: metrics.active_calc_used_percent / 1e9 },
        ];

        tests.forEach(test => {
            const diff = Math.abs(test.value - targetGB);
            const match = diff < 0.5 ? '✅ MATCH!' : '';
            console.log(`${test.name.padEnd(40)} ${test.value.toFixed(2).padStart(10)} GB ${match}`);
        });

        console.log('\n=== Raw values ===');
        console.log(`All storage_committed:     ${(metrics.all_storage_committed / 1e9).toFixed(2)} GB`);
        console.log(`All storage_used (direct): ${(metrics.all_storage_used / 1e9).toFixed(6)} GB (${(metrics.all_storage_used / 1e6).toFixed(2)} MB)`);
        console.log(`Active storage_committed:  ${(metrics.active_storage_committed / 1e9).toFixed(2)} GB`);
        console.log(`Active storage_used:       ${(metrics.active_storage_used / 1e9).toFixed(6)} GB (${(metrics.active_storage_used / 1e6).toFixed(2)} MB)`);

    } catch (e) {
        console.error('Error:', e.message);
    }
}

findAllCombinations();
