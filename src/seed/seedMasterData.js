const mongoose = require('mongoose');
const dns = require('dns');
const dotenv = require('dotenv');
dotenv.config();

// Fix for Windows / ISP DNS failure with MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const { seedMasterData } = require('./masterSeeder');

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mp_result_management';
  console.log(`[MP-RMS Seed Master] Connecting to: ${mongoUri}...`);

  try {
    await mongoose.connect(mongoUri);
    console.log('[MP-RMS Seed Master] Database connected.');

    await seedMasterData({ verbose: true });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[MP-RMS Seed Master] FAILED:', err.message);
    process.exit(1);
  }
}

run();
