const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateAllFast() {
  console.log('🚀 Mise à jour rapide de storage_used\n');
  
  // Get API data
  console.log('📡 Récupération des données API...');
  const res = await axios.post('http://192.190.136.36:6000/rpc', 
    {jsonrpc:"2.0",method:"get-pods-with-stats",id:1}, {timeout:10000});
  const pods = res.data?.result?.pods || [];
  console.log(`✅ ${pods.length} pods reçus\n`);
  
  // Build map - USE THE DIRECT FIELD from API!
  const map = new Map();
  pods.forEach(p => {
    const ip = p.address?.split(':')[0];
    const used = Number(p.storage_used) || 0; // Use direct field!
    if (ip && used > 0) map.set(ip, used);
  });
  
  // Get DB nodes
  console.log('📊 Récupération des nœuds DB...');
  const { data: nodes } = await supabase.from('pnodes').select('ip, stats');
  console.log(`✅ ${nodes.length} nœuds en DB\n`);
  
  // Update
  console.log('💾 Mise à jour...');
  let updated = 0;
  let errors = 0;
  for (const node of nodes) {
    const used = map.get(node.ip);
    if (used !== undefined) {
      const { error } = await supabase.from('pnodes').update({
        stats: {...node.stats, storage_used: used}
      }).eq('ip', node.ip);
      
      if (error) {
        errors++;
        if (errors <= 3) console.log(`  ❌ Error on ${node.ip}:`, error.message);
      } else {
        updated++;
      }
      
      if (updated % 50 === 0) console.log(`  ${updated}/${nodes.length}...`);
    }
  }
  console.log(`  Errors: ${errors}`);
  
  console.log(`\n✅ ${updated} nœuds mis à jour!\n`);
  
  // Verify
  const {data:v} = await supabase.from('pnodes').select('stats');
  const t = v.reduce((s,p)=>s+(Number(p.stats?.storage_used)||0),0);
  console.log('📊 RÉSULTAT FINAL:');
  console.log('  Total storage_used:', (t/1e9).toFixed(2), 'GB');
  console.log('  Attendu: ~500 GB');
  console.log(t > 400e9 ? '\n✅ SUCCÈS !' : '\n⚠️  Vérifiez les données');
}

updateAllFast().catch(e => console.error('Error:', e.message));
