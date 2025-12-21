const axios = require('axios');

async function checkGetStatsTotals() {
    // Liste des IPs de nœuds actifs connus
    const activeIps = [
        '192.190.136.36', '192.190.136.28', '192.190.136.29',
        '192.190.136.37', '192.190.136.38', '62.171.138.27',
        '173.212.203.145', '161.97.97.41', '207.244.255.1',
        '159.69.221.189', '178.18.250.133', '37.120.167.241',
        '173.249.36.181', '62.84.180.238', '154.38.169.212',
        '152.53.248.235', '173.212.217.77', '195.26.241.159',
        '173.212.207.32', '216.234.134.5', '185.218.125.113',
        '62.84.180.240', '62.171.173.64', '147.93.152.242',
        '173.249.29.36', '62.171.148.52', '144.126.159.237',
        '173.212.204.155', '154.53.62.132'
    ];

    console.log(`Querying get-stats on ${activeIps.length} active nodes...\n`);

    let totals = {
        total_bytes: 0,
        file_size: 0,
        total_pages: 0,
        current_index: 0,
        activeCount: 0
    };

    for (const ip of activeIps) {
        try {
            const res = await axios.post(`http://${ip}:6000/rpc`, {
                jsonrpc: '2.0',
                method: 'get-stats',
                id: 1
            }, { timeout: 2000 });

            const stats = res.data?.result;
            if (stats) {
                totals.total_bytes += (stats.total_bytes || 0);
                totals.file_size += (stats.file_size || 0);
                totals.total_pages += (stats.total_pages || 0);
                totals.current_index += (stats.current_index || 0);
                totals.activeCount++;
            }
        } catch (e) {
            // Skip failed nodes
        }
    }

    console.log('=== TOTALS FROM get-stats (active nodes) ===');
    console.log(`Successfully queried: ${totals.activeCount} nodes\n`);

    console.log('Total total_bytes:', (totals.total_bytes / 1e9).toFixed(6), 'GB');
    console.log('Total total_bytes:', (totals.total_bytes / 1e6).toFixed(2), 'MB');
    console.log('Total total_bytes:', totals.total_bytes.toLocaleString(), 'bytes\n');

    console.log('Total file_size:', (totals.file_size / 1e9).toFixed(2), 'GB');
    console.log('Total file_size:', (totals.file_size / 1e12).toFixed(2), 'TB\n');

    console.log('Total total_pages:', totals.total_pages.toLocaleString());
    console.log('Total current_index:', totals.current_index.toLocaleString());

    console.log('\n=== CHECKING FOR 4.66 GB MATCH ===');

    const targetGB = 4.66;
    const tests = [
        { name: 'total_bytes', value: totals.total_bytes / 1e9 },
        { name: 'total_bytes * 1000', value: totals.total_bytes / 1e6 },
        { name: 'file_size', value: totals.file_size / 1e9 },
        { name: 'file_size / 1000', value: totals.file_size / 1e12 },
        { name: 'total_pages (as bytes)', value: totals.total_pages / 1e9 },
        { name: 'current_index (as bytes)', value: totals.current_index / 1e9 },
    ];

    tests.forEach(test => {
        const diff = Math.abs(test.value - targetGB);
        if (diff < 0.5) {
            console.log(`✅ MATCH: ${test.name} = ${test.value.toFixed(2)} GB`);
        }
    });

    // Also check average per node
    console.log('\n=== AVERAGES PER NODE ===');
    if (totals.activeCount > 0) {
        console.log('Avg total_bytes:', (totals.total_bytes / totals.activeCount / 1e9).toFixed(6), 'GB');
        console.log('Avg file_size:', (totals.file_size / totals.activeCount / 1e9).toFixed(2), 'GB');
    }
}

checkGetStatsTotals();
