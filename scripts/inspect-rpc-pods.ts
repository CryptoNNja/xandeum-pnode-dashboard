import axios from 'axios';

const TARGET_NODE = "161.97.97.41"; 
const KNOWN_PRIVATE_IPS = ["213.199.57.70", "178.236.183.145", "207.180.203.27"];

async function inspect() {
  console.log(`Querying ${TARGET_NODE} for get-pods-with-stats...`);
  try {
    const res = await axios.post(
      `http://${TARGET_NODE}:6000/rpc`,
      { jsonrpc: "2.0", method: "get-pods-with-stats", id: 1 },
      { timeout: 5000 }
    );

    const pods = res.data?.result?.pods;
    if (!pods) {
      console.log('No pods returned.');
      return;
    }

    console.log(`Received ${pods.length} pods.`);

    let found = 0;
    pods.forEach((pod: any) => {
      const address = pod.address;
      if (!address) return;
      const ip = address.split(':')[0];

      if (KNOWN_PRIVATE_IPS.includes(ip)) {
        console.log(`\nFound Private Node ${ip}:`);
        console.log(JSON.stringify(pod, null, 2));
        found++;
      }
    });

    if (found === 0) {
      console.log('\nNone of the sample private IPs were found in the response.');
      console.log('\nSample Pods from response:');
      console.log(JSON.stringify(pods.slice(0, 3), null, 2));
    }

  } catch (error: any) {
    console.error('Error querying node:', error.message);
  }
}

inspect();