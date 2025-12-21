const axios = require('axios');

async function findStorageSubset() {
    const testIp = '192.190.136.36';

    try {
        const res = await axios.post(`http://${testIp}:6000/rpc`, {
            jsonrpc: '2.0',
            method: 'get-pods-with-stats',
            id: 1
        }, { timeout: 5000 });

        const pods = res.data?.result?.pods || [];

        console.log('=== Looking for subsets that total ~4.66 GB ===\n');

        const targetGB = 4.66;
        const targetBytes = targetGB * 1e9;

        // Try different filtering criteria
        const tests = [
            {
                name: 'Only is_public = true',
                filter: (p) => p.is_public === true
            },
            {
                name: 'Only is_public = false',
                filter: (p) => p.is_public === false
            },
            {
                name: 'Only version 0.8.0',
                filter: (p) => p.version === '0.8.0'
            },
            {
                name: 'Only with storage_used > 0',
                filter: (p) => (p.storage_used || 0) > 0
            },
            {
                name: 'Only uptime > 0',
                filter: (p) => (p.uptime || 0) > 0
            },
        ];

        tests.forEach(test => {
            const filtered = pods.filter(p => {
                const ip = p.address?.split(':')[0];
                return ip !== '127.0.0.1' && ip !== 'localhost' && test.filter(p);
            });

            let totalCommitted = 0;
            let totalUsed = 0;

            filtered.forEach(p => {
                totalCommitted += (p.storage_committed || 0);
                totalUsed += (p.storage_used || 0);
            });

            const match = Math.abs(totalCommitted / 1e9 - targetGB) < 0.5
                         || Math.abs(totalUsed / 1e9 - targetGB) < 0.5;

            console.log(`${test.name}:`);
            console.log(`  Count: ${filtered.length}`);
            console.log(`  Total committed: ${(totalCommitted / 1e9).toFixed(2)} GB ${Math.abs(totalCommitted / 1e9 - targetGB) < 0.5 ? '✅' : ''}`);
            console.log(`  Total used: ${(totalUsed / 1e9).toFixed(6)} GB ${Math.abs(totalUsed / 1e9 - targetGB) < 0.5 ? '✅' : ''}`);
            console.log('');
        });

        // Maybe it's just the SUM of all storage_used but interpreted as GB instead of bytes?
        let totalStorageUsed = 0;
        pods.forEach(p => {
            const ip = p.address?.split(':')[0];
            if (ip === '127.0.0.1' || ip === 'localhost') return;
            totalStorageUsed += (p.storage_used || 0);
        });

        console.log('=== Alternative interpretation ===');
        console.log(`Total storage_used in bytes: ${totalStorageUsed.toLocaleString()}`);
        console.log(`If interpreted as GB directly: ${totalStorageUsed} "GB" (nonsensical)`);
        console.log(`Actual in GB: ${(totalStorageUsed / 1e9).toFixed(6)} GB`);
        console.log(`Actual in MB: ${(totalStorageUsed / 1e6).toFixed(2)} MB\n`);

        // Maybe they sum storage_committed × storage_usage_percent for a subset?
        console.log('=== Calculated storage used (committed × percent) ===');
        let calcTotal = 0;
        pods.forEach(p => {
            const ip = p.address?.split(':')[0];
            if (ip === '127.0.0.1' || ip === 'localhost') return;

            const committed = p.storage_committed || 0;
            let percent = p.storage_usage_percent || 0;
            if (percent > 1) percent /= 100;

            calcTotal += committed * percent;
        });

        console.log(`Calculated total: ${(calcTotal / 1e9).toFixed(2)} GB`);
        console.log(`Calculated total: ${(calcTotal / 1e6).toFixed(2)} MB`);

        if (Math.abs(calcTotal / 1e9 - targetGB) < 0.5) {
            console.log('✅ MATCH! This is probably it!');
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

findStorageSubset();
