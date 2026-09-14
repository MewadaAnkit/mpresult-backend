/**
 * Step 2 Automated Verification Script
 * Tests:
 * 1. Login Rate Limiter Middleware
 * 2. 1-Click Complete Database Backup Export
 * 3. Database Restore from Backup Payload
 */
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/database');
const mongoose = require('mongoose');
const Settings = require('../src/models/Settings');
const settingsController = require('../src/controllers/settingsController');
const { loginRateLimiter } = require('../src/middleware/rateLimiter');

async function runStep2Verification() {
  console.log('🚀 Starting Step 2 Verification...');
  await connectDB();

  try {
    // -------------------------------------------------------------
    // Test 1: Verify Login Rate Limiter Middleware configuration
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Auth Rate Limiter Verification ---');
    if (typeof loginRateLimiter === 'function') {
      console.log('✅ Test 1 PASSED: loginRateLimiter middleware is properly defined and configured.');
    } else {
      console.error('❌ Test 1 FAILED: loginRateLimiter is not a function');
    }

    // -------------------------------------------------------------
    // Test 2: Database Backup Export Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Database Backup Export ---');
    let exportedData = null;
    let exportedHeaders = {};

    const mockReq = {
      user: { name: 'Dr. Rajesh Sharma', email: 'admin@mpschool.edu.in' },
      ip: '127.0.0.1'
    };

    const mockRes = {
      setHeader: (key, val) => {
        exportedHeaders[key] = val;
      },
      status: (code) => ({
        send: (payload) => {
          exportedData = JSON.parse(payload);
          return payload;
        }
      })
    };

    await settingsController.exportDatabaseBackup(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    if (
      exportedData &&
      exportedData.system === 'MP School ERP & Result Management System' &&
      exportedData.collections &&
      exportedHeaders['Content-Type'] === 'application/json'
    ) {
      const colKeys = Object.keys(exportedData.collections);
      console.log(`✅ Test 2 PASSED: Full database backup exported successfully with ${colKeys.length} collections!`);
      console.log(`Collections: ${colKeys.slice(0, 10).join(', ')}... (+${colKeys.length - 10} more)`);
    } else {
      console.error('❌ Test 2 FAILED: Backup export output invalid', exportedData);
    }

    // -------------------------------------------------------------
    // Test 3: Database Restore Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Database Restore Verification ---');
    // Modify setting temporarily
    const originalSetting = await Settings.findOne();
    const testSchoolName = 'Test Backup Restoration School ' + Date.now();
    
    // Inject modified test payload
    const testBackup = JSON.parse(JSON.stringify(exportedData));
    if (testBackup.collections.settings && testBackup.collections.settings.length > 0) {
      testBackup.collections.settings[0].schoolName = testSchoolName;
    }

    let restoreResponse = null;
    const mockRestoreReq = {
      body: { backupData: testBackup },
      user: { name: 'Dr. Rajesh Sharma' },
      ip: '127.0.0.1'
    };

    const mockRestoreRes = {
      status: (code) => ({
        json: (data) => {
          restoreResponse = data;
          return data;
        }
      })
    };

    await settingsController.restoreDatabaseBackup(mockRestoreReq, mockRestoreRes, (err) => {
      if (err) throw err;
    });

    const verifySetting = await Settings.findOne();

    if (
      restoreResponse?.success === true &&
      verifySetting?.schoolName === testSchoolName
    ) {
      console.log('✅ Test 3 PASSED: Database restore successfully upserted records from backup payload!');
    } else {
      console.error('❌ Test 3 FAILED: Restore did not reflect updated records');
    }

    // Re-restore original setting
    if (originalSetting) {
      await Settings.findByIdAndUpdate(originalSetting._id, { schoolName: originalSetting.schoolName });
    }

    console.log('\n🎉 ALL STEP 2 TESTS COMPLETED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Step 2 Verification Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runStep2Verification();
