const app = require('./src/app');
const connectDB = require('./src/config/database');
const config = require('./src/config/environment');

const startServer = async () => {
  // Connect to MP Result Management isolated database
  await connectDB();

  // Auto-seed foundational master data (classes, schemes, rules, subjects, admin) if database is empty/fresh
  const { autoSeedMasterDataIfEmpty } = require('./src/seed/masterSeeder');
  await autoSeedMasterDataIfEmpty();

  const PORT = config.PORT || 5001;

  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  MP BOARD RESULT MANAGEMENT SYSTEM BACKEND`);
    console.log(`  Running in [${config.NODE_ENV}] mode on PORT: ${PORT}`);
    console.log(`  API Health: http://localhost:${PORT}/api/health`);
    console.log(`  Connected Database: mp_result_management`);
    console.log(`=======================================================`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.error(`[MP-RMS Critical] Unhandled Rejection: ${err.message}`);
  });
};

startServer();
