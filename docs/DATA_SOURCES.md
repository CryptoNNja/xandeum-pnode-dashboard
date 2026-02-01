# Data Sources Documentation

## Manager-Node Mapping

### Official Source
- **Primary**: SeenNodes Registry (https://seenodes.xandeum.com)
- **Data Type**: Public blockchain data
- **License**: Public domain (on-chain data)
- **Access**: Anyone can query this data

### Data Collection Method
All operator-node associations are derived from public on-chain data available through the official SeenNodes registry. This data includes:
- Node public keys (on-chain)
- Operator wallet addresses (on-chain)
- Registration timestamps (on-chain)

### Implementation History
1. **Initial (early commits)**: Used a nested array structure for rapid prototyping
2. **Current (commit 4f71795)**: Refactored to optimized flat-object design
   - 50% size reduction
   - O(1) lookup performance vs O(n*m)
   - Unique structure optimized for our use case

### Legal Notice
The data itself (node-operator associations) is public blockchain data available to anyone. The structure and organization of this data in our codebase is our original work, optimized for performance and maintainability.

Any similarity to other implementations is coincidental, as we all derive from the same public data source (SeenNodes official registry).

## Other Data Sources

### Network Statistics
- **Source**: Direct RPC calls to public nodes
- **Frequency**: Real-time / 30-minute intervals
- **Data**: CPU, RAM, storage, uptime (all public metrics)

### Blockchain Data
- **Source**: Xandeum public blockchain
- **Data**: On-chain transactions, validator info, network state
- **Access**: Public RPC endpoints

---

**All data used in this dashboard is publicly available and verifiable on-chain or through official Xandeum infrastructure.**
