// Script Node.js pour insérer un point de test avec la bonne date
const { recordNodeStats } = require('../lib/supabase'); // eslint-disable-line @typescript-eslint/no-require-imports

async function insertTestPoint() {
  await recordNodeStats('173.212.203.145', {
    cpu_percent: 10,
    ram_used: 1000,
    ram_total: 2000,
    file_size: 500000,
    uptime: 3600,
    packets_sent: 100,
    packets_received: 200
  });
  console.log('Point inséré avec la date correcte !');
}

insertTestPoint();
