const axios = require('axios');

async function sumAllStorageUsed() {
    const testIp = '192.190.136.36';

    console.log('Fetching get-pods-with-stats from', testIp, '...\n');

    try {
        const res = await axios.post(`http://${testIp}:6000/rpc`, {
            jsonrpc: '2.0',
            method: 'get-pods-with-stats',
            id: 1
        }, { timeout: 5000 });

        const pods = res.data?.result?.pods || [];

        let totalStorageUsed = 0;
        let totalStorageCommitted = 0;
        let totalCalculated = 0;
        let podCount = 0;
        let podsWithData = 0;

        const samples = [];

        pods.forEach(pod => {
            const ip = pod.address?.split(':')[0];

            // Skip localhost
            if (ip === '127.0.0.1' || ip === 'localhost') {
                return;
            }

            podCount++;

            const committed = pod.storage_committed || 0;
            const used = pod.storage_used || 0;
            let percent = pod.storage_usage_percent || 0;

            // Normalize percent
            if (percent > 1) {
                percent = percent / 100;
            }

            const calculated = committed * percent;

            totalStorageCommitted += committed;
            totalStorageUsed += used;
            totalCalculated += calculated;

            if (used > 0 && samples.length < 10) {
                samples.push({
                    ip,
                    address: pod.address,
                    committed: (committed / 1e9).toFixed(2) + ' GB',
                    percent: percent,
                    used: used + ' bytes',
                    calculated: (calculated / 1e9).toFixed(6) + ' GB'
                });
            }

            if (used > 0 || calculated > 0) {
                podsWithData++;
            }
        });

        console.log('=== SUMMARY ===');
        console.log('Total pods (excluding localhost):', podCount);
        console.log('Pods with storage data:', podsWithData);
        console.log('');

        console.log('Total storage_committed:', (totalStorageCommitted / 1e9).toFixed(2), 'GB');
        console.log('');

        console.log('Total storage_used (direct field):');
        console.log('  ', totalStorageUsed.toLocaleString(), 'bytes');
        console.log('  ', (totalStorageUsed / 1e6).toFixed(2), 'MB');
        console.log('  ', (totalStorageUsed / 1e9).toFixed(6), 'GB');
        console.log('');

        console.log('Total calculated (committed × percent):');
        console.log('  ', (totalCalculated / 1e9).toFixed(6), 'GB');
        console.log('  ', (totalCalculated / 1e6).toFixed(2), 'MB');
        console.log('');

        // Check if either matches 4.66 GB
        const targetGB = 4.66;
        console.log('=== CHECKING FOR 4.66 GB MATCH ===');

        if (Math.abs(totalStorageUsed / 1e9 - targetGB) < 0.5) {
            console.log('✅ storage_used (direct) matches!');
        } else {
            console.log('❌ storage_used (direct):', (totalStorageUsed / 1e9).toFixed(2), 'GB - does NOT match');
        }

        if (Math.abs(totalCalculated / 1e9 - targetGB) < 0.5) {
            console.log('✅ calculated (committed × percent) matches!');
        } else {
            console.log('❌ calculated:', (totalCalculated / 1e9).toFixed(2), 'GB - does NOT match');
        }

        console.log('\n=== SAMPLE PODS WITH STORAGE_USED > 0 ===');
        samples.forEach((s, i) => {
            console.log(`${i + 1}. ${s.address}`);
            console.log(`   Committed: ${s.committed}`);
            console.log(`   Percent: ${s.percent}`);
            console.log(`   storage_used (API): ${s.used}`);
            console.log(`   Calculated: ${s.calculated}`);
            console.log('');
        });

    } catch (e) {
        console.error('Error:', e.message);
    }
}

sumAllStorageUsed();
