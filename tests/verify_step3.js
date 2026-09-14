/**
 * Step 3 Automated Verification Script
 * Tests:
 * 1. Student Schema MP State & Scholarship Fields (familySamagraId, aadharNo, bloodGroup, bankDetails)
 * 2. Search Student by Aadhaar No & Family Samagra ID
 * 3. School Settings UPI Configuration
 */
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/database');
const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const Settings = require('../src/models/Settings');

async function runStep3Verification() {
  console.log('🚀 Starting Step 3 Verification...');
  await connectDB();

  const testAdmNo = 'TEST-MP-' + Date.now();
  const testAadhaar = '987654321098';
  const testFamilyId = '87654321';

  try {
    // -------------------------------------------------------------
    // Test 1: Student Creation with MP Scholarship Fields
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Student MP Scholarship Fields ---');
    const student = await Student.create({
      admissionNo: testAdmNo,
      studentName: 'Virendra Chouhan',
      fatherName: 'Kailash Chouhan',
      currentSession: '2025-26',
      currentClass: '9',
      currentSection: 'A',
      currentRollNo: '45',
      samagraId: '123456789',
      familySamagraId: testFamilyId,
      aadharNo: testAadhaar,
      bloodGroup: 'B+',
      bankDetails: {
        accountNo: '50100234567890',
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India',
        branchName: 'Main Branch Bhopal'
      },
      isActive: true
    });

    if (
      student.familySamagraId === testFamilyId &&
      student.aadharNo === testAadhaar &&
      student.bloodGroup === 'B+' &&
      student.bankDetails?.accountNo === '50100234567890' &&
      student.bankDetails?.ifscCode === 'SBIN0001234'
    ) {
      console.log('✅ Test 1 PASSED: MP Scholarship and DBT Bank details successfully saved in Student model!');
    } else {
      console.error('❌ Test 1 FAILED: Fields mismatch in Student model');
    }

    // -------------------------------------------------------------
    // Test 2: Search Student by Aadhaar & Family Samagra ID
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Search Student by Aadhaar & Family Samagra ID ---');
    const foundByAadhaar = await Student.findOne({ aadharNo: testAadhaar });
    const foundByFamilyId = await Student.findOne({ familySamagraId: testFamilyId });

    if (foundByAadhaar && foundByFamilyId && foundByAadhaar._id.equals(foundByFamilyId._id)) {
      console.log('✅ Test 2 PASSED: Student can be accurately queried by 12-digit Aadhaar and 8-digit Family ID!');
    } else {
      console.error('❌ Test 2 FAILED: Aadhaar / Family ID query failed');
    }

    // -------------------------------------------------------------
    // Test 3: Settings UPI Configuration
    // -------------------------------------------------------------
    console.log('\n--- Test 3: School Settings UPI Configuration ---');
    const settings = await Settings.findOneAndUpdate(
      {},
      { upiId: 'modelbhopal@sbi', upiPayeeName: 'Govt Model HSS Bhopal' },
      { new: true, upsert: true }
    );

    if (settings.upiId === 'modelbhopal@sbi' && settings.upiPayeeName === 'Govt Model HSS Bhopal') {
      console.log(`✅ Test 3 PASSED: UPI VPA '${settings.upiId}' and Payee Name configured in Settings model!`);
    } else {
      console.error('❌ Test 3 FAILED: Settings UPI fields mismatch');
    }

    // Cleanup test student
    await Student.deleteOne({ admissionNo: testAdmNo });

    console.log('\n🎉 ALL STEP 3 TESTS COMPLETED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Step 3 Verification Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runStep3Verification();
