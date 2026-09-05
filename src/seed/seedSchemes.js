const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { seedAllSchemes } = require('./schemeSeeder');

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mp_result_management';
  console.log(`[MP-RMS Seed Schemes] Connecting to: ${mongoUri}...`);

  try {
    await mongoose.connect(mongoUri);
    console.log('[MP-RMS Seed Schemes] Database connected.');

    const result = await seedAllSchemes({ verbose: true });
    console.log('\n=======================================================');
    console.log(`  MP EXAMINATION SCHEMES & RULES SEEDING COMPLETE!`);
    console.log(`  Grade Rules: ${result.gradeRulesCount}`);
    console.log(`  Passing Rules: ${result.passingRulesCount}`);
    console.log(`  Examination Schemes: ${result.schemesCount}`);
    console.log('=======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[MP-RMS Seed Schemes] FAILED:', err.message);
    process.exit(1);
  }
}

run();
