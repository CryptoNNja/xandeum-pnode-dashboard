import { calculateNodeScore, getScoreLabel, getScoreColor } from '../lib/scoring.js';

// Sample data from the API (similar to what we saw in curl)
const samplePNode = {
  ip: "173.212.203.145",
  status: "active", // assuming active
  stats: {
    cpu_percent: 0.164744645357132,
    ram_used: 805167104,
    ram_total: 12541607936,
    uptime: 500467,
    packets_sent: 20939,
    packets_received: 20247
  }
};

console.log('Sample pNode data:', samplePNode);
console.log('Calculated score:', calculateNodeScore(samplePNode));
console.log('Score label:', getScoreLabel(calculateNodeScore(samplePNode)));
console.log('Score color:', getScoreColor(calculateNodeScore(samplePNode)));

// Test with different scenarios
const lowScoreNode = {
  ip: "test",
  status: "active",
  stats: {
    cpu_percent: 95, // high CPU
    ram_used: 12000000000, // high RAM usage
    ram_total: 12541607936,
    uptime: 100, // low uptime
    packets_sent: 1000,
    packets_received: 10000 // unbalanced
  }
};

console.log('\nLow score node:');
console.log('Score:', calculateNodeScore(lowScoreNode));
console.log('Label:', getScoreLabel(calculateNodeScore(lowScoreNode)));