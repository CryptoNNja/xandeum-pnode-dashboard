/**
 * Migration script: Transform managers_node_data.json to new pnode_registry.json structure
 * 
 * Old structure (similar to competitor):
 * - Nested arrays with manager_index, manager_address, nodes[]
 * - node_label (pubkey1, pubkey2, etc.)
 * - registered_time as formatted string
 * 
 * New structure (unique to our dashboard):
 * - Flat registry object: { [pubkey]: operator_wallet }
 * - Separate operators object with metadata
 * - ISO timestamps instead of formatted strings
 * - No redundant fields
 */

import fs from 'fs';
import path from 'path';

// Read old structure
const oldDataPath = path.join(process.cwd(), 'config', 'managers_node_data.json');
const oldData = JSON.parse(fs.readFileSync(oldDataPath, 'utf-8'));

// Initialize new structure
const newStructure = {
  meta: {
    version: '1.0.0',
    last_updated: new Date().toISOString(),
    source: 'seenodes_public_registry',
    total_operators: oldData.summary.total_managers,
    total_nodes: oldData.summary.total_pnode_pubkeys,
  },
  registry: {} as Record<string, string>, // pubkey -> operator_wallet mapping
  operators: {} as Record<string, {
    wallet: string;
    node_count: number;
    first_seen: string;
  }>,
};

// Transform data
console.log(`🔄 Migrating ${oldData.managers.length} operators...`);

oldData.managers.forEach((manager: any) => {
  const operatorWallet = manager.manager_address;
  const operatorId = `op_${manager.manager_index}`;

  // Find earliest registration time for this operator
  let earliestTime = new Date();
  manager.nodes.forEach((node: any) => {
    // Parse old format date (e.g., "3/25/2025, 5:08:53 AM")
    const nodeDate = new Date(node.registered_time);
    if (nodeDate < earliestTime) {
      earliestTime = nodeDate;
    }

    // Add to flat registry
    newStructure.registry[node.pnode_pubkey] = operatorWallet;
  });

  // Add operator metadata
  newStructure.operators[operatorId] = {
    wallet: operatorWallet,
    node_count: manager.nodes.length,
    first_seen: earliestTime.toISOString(),
  };
});

// Write new structure
const newDataPath = path.join(process.cwd(), 'config', 'pnode_registry.json');
fs.writeFileSync(newDataPath, JSON.stringify(newStructure, null, 2), 'utf-8');

console.log(`✅ Migration complete!`);
console.log(`📊 Stats:`);
console.log(`   - Operators: ${Object.keys(newStructure.operators).length}`);
console.log(`   - Nodes: ${Object.keys(newStructure.registry).length}`);
console.log(`📁 New file: ${newDataPath}`);
console.log(`\n⚠️  Next steps:`);
console.log(`   1. Update app/api/manager-mapping/route.ts to use new structure`);
console.log(`   2. Test the API endpoint`);
console.log(`   3. Delete config/managers_node_data.json`);
console.log(`   4. Clean git history with BFG or git filter-repo`);
