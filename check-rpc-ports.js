const axios = require('axios');

async function checkRPCPorts() {
    const testIp = '192.190.136.36';

    console.log('Checking RPC ports from get-pods-with-stats...\n');

    try {
        const res = await axios.post(`http://${testIp}:6000/rpc`, {
            jsonrpc: '2.0',
            method: 'get-pods-with-stats',
            id: 1
        }, { timeout: 5000 });

        const pods = res.data?.result?.pods || [];

        console.log(`Total pods: ${pods.length}\n`);

        // Group by rpc_port
        const portCounts = {};
        pods.forEach(pod => {
            const port = pod.rpc_port || 'undefined';
            portCounts[port] = (portCounts[port] || 0) + 1;
        });

        console.log('=== RPC Port Distribution ===');
        Object.entries(portCounts).sort((a, b) => b[1] - a[1]).forEach(([port, count]) => {
            console.log(`Port ${port}: ${count} pods`);
        });

        console.log('\n=== Sample pods with different ports ===');
        const samples = {};
        pods.forEach(pod => {
            const port = pod.rpc_port || 'undefined';
            if (!samples[port] && Object.keys(samples).length < 5) {
                const ip = pod.address?.split(':')[0];
                samples[port] = {
                    ip,
                    address: pod.address,
                    rpc_port: pod.rpc_port,
                    storage_committed: pod.storage_committed,
                    storage_used: pod.storage_used
                };
            }
        });

        Object.entries(samples).forEach(([port, pod]) => {
            console.log(`\nPort ${port}:`);
            console.log(`  Address: ${pod.address}`);
            console.log(`  IP: ${pod.ip}`);
            console.log(`  RPC Port: ${pod.rpc_port}`);
            console.log(`  Committed: ${(pod.storage_committed / 1e9).toFixed(2)} GB`);
            console.log(`  Used: ${pod.storage_used} bytes`);
        });

        // Try querying a node on its actual rpc_port
        console.log('\n=== Testing query on actual RPC port ===');
        const testPod = pods.find(p => p.rpc_port && p.rpc_port !== 6000);
        if (testPod) {
            const ip = testPod.address?.split(':')[0];
            const port = testPod.rpc_port;

            console.log(`Testing ${ip} on port ${port} (instead of 6000)...\n`);

            try {
                const testRes = await axios.post(`http://${ip}:${port}/rpc`, {
                    jsonrpc: '2.0',
                    method: 'get-stats',
                    id: 1
                }, { timeout: 3000 });

                const stats = testRes.data?.result;
                console.log('✅ Success! Got response:');
                console.log(`  total_bytes: ${stats?.total_bytes}`);
                console.log(`  file_size: ${stats?.file_size}`);
                console.log(`  total_pages: ${stats?.total_pages}`);
            } catch (e) {
                console.log(`❌ Failed: ${e.message}`);
            }
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkRPCPorts();
