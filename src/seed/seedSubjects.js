const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { seedAllClassSubjects } = require('./subjectSeeder');

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mp_result_management';
  console.log(`[MP-RMS Seed Subjects] Connecting to: ${mongoUri}...`);

  try {
    await mongoose.connect(mongoUri);
    console.log('[MP-RMS Seed Subjects] Database connected.');

    const result = await seedAllClassSubjects({ verbose: true });
    console.log(`[MP-RMS Seed Subjects] SUCCESS! ${result.createdCount} new subjects added, ${result.updatedCount} verified.`);
    
    process.exit(0);
  } catch (err) {
    console.error('[MP-RMS Seed Subjects] FAILED:', err.message);
    process.exit(1);
  }
}

run();
