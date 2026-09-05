const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

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
