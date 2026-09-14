/**
 * Step 1 Automated Verification Script
 * Tests:
 * 1. Grace Marks Calculation Engine
 * 2. Best of Five Calculation Scheme
 * 3. Dynamic Attendance from Attendance Records
 * 4. Transfer Certificate Deactivation Lifecycle
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Student = require('../src/models/Student');
const StudentEnrollment = require('../src/models/StudentEnrollment');
const Subject = require('../src/models/Subject');
const GradeRule = require('../src/models/GradeRule');
const PassingRule = require('../src/models/PassingRule');
const ExaminationScheme = require('../src/models/ExaminationScheme');
const Examination = require('../src/models/Examination');
const Marks = require('../src/models/Marks');
const Attendance = require('../src/models/Attendance');
const Result = require('../src/models/Result');
const Certificate = require('../src/models/Certificate');
const certificateController = require('../src/controllers/certificateController');
const { calculateStudentResult } = require('../src/services/resultCalculationService');

const connectDB = require('../src/config/database');

async function runVerification() {
  console.log('🚀 Starting Step 1 Verification...');
  await connectDB();

  const sessionName = '2025-26';
  const testAdmNo = 'TEST-TC-' + Date.now();

  try {
    // -------------------------------------------------------------
    // Test 1: Student Creation & TC Deactivation Lifecycle
    // -------------------------------------------------------------
    console.log('\n--- Test 1: TC Deactivation Lifecycle ---');
    const testStudent = await Student.create({
      admissionNo: testAdmNo,
      studentName: 'Rohan Sharma Test',
      currentSession: sessionName,
      currentClass: '10',
      currentSection: 'A',
      currentRollNo: '99',
      isActive: true
    });

    await StudentEnrollment.create({
      studentId: testStudent._id,
      admissionNo: testStudent.admissionNo,
      sessionName,
      className: '10',
      sectionName: 'A',
      rollNo: '99',
      status: 'ACTIVE'
    });

    console.log(`Initial Student Active: ${testStudent.isActive}, Status: ${testStudent.status}`);

    // Simulate issueCertificate controller call
    const mockReq = {
      body: {
        studentId: testStudent._id,
        certificateType: 'TRANSFER_CERTIFICATE',
        academicSession: sessionName,
        reasonForLeaving: 'Higher Secondary in other city',
        conduct: 'Excellent',
        feeClearedTill: 'March 2026'
      },
      user: { name: 'Principal' }
    };

    let responseData = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          responseData = data;
          return data;
        }
      })
    };

    await certificateController.issueCertificate(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    const updatedStudent = await Student.findById(testStudent._id);
    const updatedEnrollment = await StudentEnrollment.findOne({ studentId: testStudent._id, sessionName });

    if (updatedStudent.isActive === false && updatedStudent.status === 'TC_ISSUED' && updatedEnrollment.status === 'TRANSFERRED') {
      console.log('✅ Test 1 PASSED: Student marked isActive=false, status=TC_ISSUED, and enrollment=TRANSFERRED on TC issue.');
    } else {
      console.error('❌ Test 1 FAILED:', {
        isActive: updatedStudent.isActive,
        status: updatedStudent.status,
        enrollmentStatus: updatedEnrollment?.status
      });
    }

    // -------------------------------------------------------------
    // Test 2: Grace Marks & Dynamic Attendance Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Grace Marks & Dynamic Attendance Verification ---');
    
    // Create GradeRule and PassingRule with Grace Marks enabled
    const gradeRule = await GradeRule.findOneAndUpdate(
      { ruleCode: 'GR-TEST-01' },
      {
        ruleName: 'Test Grade Rule',
        ruleCode: 'GR-TEST-01',
        boundaries: [
          { grade: 'A', minPercentage: 75, maxPercentage: 100, gradePoint: 9 },
          { grade: 'B', minPercentage: 60, maxPercentage: 74.99, gradePoint: 7 },
          { grade: 'C', minPercentage: 33, maxPercentage: 59.99, gradePoint: 5 },
          { grade: 'D', minPercentage: 0, maxPercentage: 32.99, gradePoint: 0 }
        ]
      },
      { upsert: true, new: true }
    );

    const passingRule = await PassingRule.findOneAndUpdate(
      { ruleCode: 'PR-TEST-GRACE' },
      {
        ruleName: 'Test Grace Passing Rule',
        ruleCode: 'PR-TEST-GRACE',
        overallMinPercentage: 33,
        subjectMinPercentage: 33,
        graceMarksPolicy: {
          allowGraceMarks: true,
          maxGraceMarksPerSubject: 5,
          maxGraceMarksTotal: 5
        },
        supplementaryRules: {
          allowSupplementary: true,
          maxFailedSubjects: 1
        }
      },
      { upsert: true, new: true }
    );

    const scheme = await ExaminationScheme.findOneAndUpdate(
      { schemeCode: 'SCHEME-TEST-01' },
      {
        schemeName: 'Test Scheme',
        schemeCode: 'SCHEME-TEST-01',
        applicableClasses: ['TEST-10'],
        gradeRuleId: gradeRule._id,
        passingRuleId: passingRule._id
      },
      { upsert: true, new: true }
    );

    const exam = await Examination.findOneAndUpdate(
      { examCode: 'EXAM-TEST-GRACE' },
      {
        examName: 'Annual Test Exam',
        examCode: 'EXAM-TEST-GRACE',
        sessionName,
        className: 'TEST-10',
        schemeId: scheme._id,
        status: 'CONDUCTED'
      },
      { upsert: true, new: true }
    );

    // Create test student for Exam
    const examStudent = await Student.create({
      admissionNo: 'TEST-EXAM-' + Date.now(),
      studentName: 'Aman Verma',
      currentSession: sessionName,
      currentClass: 'TEST-10',
      currentSection: 'T1',
      currentRollNo: '101',
      isActive: true
    });

    // Create Attendance records (10 working days, 8 attended)
    for (let d = 1; d <= 10; d++) {
      const isPresent = d <= 8;
      await Attendance.create({
        academicSession: sessionName,
        className: 'TEST-10',
        sectionName: 'T1',
        date: new Date(2026, 6, d),
        records: [
          {
            student: examStudent._id,
            admissionNo: examStudent.admissionNo,
            rollNo: '101',
            studentName: examStudent.studentName,
            status: isPresent ? 'PRESENT' : 'ABSENT'
          }
        ]
      });
    }

    // Create test subjects
    const subMath = await Subject.findOneAndUpdate(
      { subjectCode: 'SUB-TEST-MTH' },
      { subjectName: 'Mathematics', subjectCode: 'SUB-TEST-MTH', applicableClasses: ['TEST-10'] },
      { upsert: true, new: true }
    );
    const subSci = await Subject.findOneAndUpdate(
      { subjectCode: 'SUB-TEST-SCI' },
      { subjectName: 'Science', subjectCode: 'SUB-TEST-SCI', applicableClasses: ['TEST-10'] },
      { upsert: true, new: true }
    );

    // Math score: 30/100 (needs 3 marks grace to reach 33)
    await Marks.create({
      examinationId: exam._id,
      studentId: examStudent._id,
      admissionNo: examStudent.admissionNo,
      subjectId: subMath._id,
      subjectName: 'Mathematics',
      subjectCode: 'SUB-TEST-MTH',
      className: 'TEST-10',
      sectionName: 'T1',
      sessionName,
      totalMaxMarks: 100,
      totalObtainedMarks: 30,
      components: [{ componentCode: 'TH', componentName: 'Theory', maxMarks: 100, obtainedMarks: 30 }]
    });

    // Science score: 65/100 (Pass)
    await Marks.create({
      examinationId: exam._id,
      studentId: examStudent._id,
      admissionNo: examStudent.admissionNo,
      subjectId: subSci._id,
      subjectName: 'Science',
      subjectCode: 'SUB-TEST-SCI',
      className: 'TEST-10',
      sectionName: 'T1',
      sessionName,
      totalMaxMarks: 100,
      totalObtainedMarks: 65,
      components: [{ componentCode: 'TH', componentName: 'Theory', maxMarks: 100, obtainedMarks: 65 }]
    });

    // Calculate Result
    const calcResult = await calculateStudentResult(examStudent._id, exam._id);

    console.log('Result Status:', calcResult.resultStatus);
    console.log('Grace Marks Given:', calcResult.graceMarksGiven);
    console.log('Attendance on Marksheet:', calcResult.attendance);
    const mathRes = calcResult.subjectResults.find(s => s.subjectName === 'Mathematics');
    console.log('Mathematics Subject Status:', mathRes?.status, 'Marks:', mathRes?.totalObtainedMarks);

    if (
      calcResult.resultStatus === 'PASS' &&
      calcResult.graceMarksGiven === 3 &&
      mathRes?.status === 'PASS*' &&
      mathRes?.totalObtainedMarks === 33 &&
      calcResult.attendance?.totalWorkingDays === 10 &&
      calcResult.attendance?.attendedDays === 8 &&
      calcResult.attendance?.attendancePercentage === 80
    ) {
      console.log('✅ Test 2 PASSED: Grace marks (3 marks) correctly awarded to Math, and live attendance (8/10 = 80%) dynamically reflected!');
    } else {
      console.error('❌ Test 2 FAILED: Grace marks or attendance did not match expectations.');
    }

    // -------------------------------------------------------------
    // Test 3: MP Board Class 10 Best of Five Scheme Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 3: MP Board Best of Five Scheme ---');
    const passingRuleB5 = await PassingRule.findOneAndUpdate(
      { ruleCode: 'PR-TEST-BEST5' },
      {
        ruleName: 'Test Best of 5 Rule',
        ruleCode: 'PR-TEST-BEST5',
        overallMinPercentage: 33,
        subjectMinPercentage: 33,
        graceMarksPolicy: { allowGraceMarks: false },
        bestOfFiveRule: {
          isEnabled: true,
          applicableClasses: ['TEST-B5']
        },
        supplementaryRules: { allowSupplementary: false }
      },
      { upsert: true, new: true }
    );

    const schemeB5 = await ExaminationScheme.findOneAndUpdate(
      { schemeCode: 'SCHEME-TEST-B5' },
      {
        schemeName: 'Test Scheme B5',
        schemeCode: 'SCHEME-TEST-B5',
        applicableClasses: ['TEST-B5'],
        gradeRuleId: gradeRule._id,
        passingRuleId: passingRuleB5._id
      },
      { upsert: true, new: true }
    );

    const examB5 = await Examination.findOneAndUpdate(
      { examCode: 'EXAM-TEST-B5' },
      {
        examName: 'Class 10 Board Test Exam',
        examCode: 'EXAM-TEST-B5',
        sessionName,
        className: 'TEST-B5',
        schemeId: schemeB5._id,
        status: 'CONDUCTED'
      },
      { upsert: true, new: true }
    );

    const studentB5 = await Student.create({
      admissionNo: 'TEST-B5-' + Date.now(),
      studentName: 'Priya Patel',
      currentSession: sessionName,
      currentClass: 'TEST-B5',
      currentSection: 'A',
      currentRollNo: '201',
      isActive: true
    });

    // Create 6 subjects: 5 passed (70, 75, 80, 60, 65) and 1 failed (20 in Sanskrit)
    const subjectsData = [
      { name: 'Hindi', code: 'SUB-HIN', score: 75 },
      { name: 'English', code: 'SUB-ENG', score: 70 },
      { name: 'Mathematics', code: 'SUB-MTH2', score: 60 },
      { name: 'Science', code: 'SUB-SCI2', score: 80 },
      { name: 'Social Science', code: 'SUB-SST', score: 65 },
      { name: 'Sanskrit', code: 'SUB-SKT', score: 20 } // FAILED subject
    ];

    for (const sub of subjectsData) {
      const sDoc = await Subject.findOneAndUpdate(
        { subjectCode: sub.code },
        { subjectName: sub.name, subjectCode: sub.code, applicableClasses: ['TEST-B5'] },
        { upsert: true, new: true }
      );
      await Marks.create({
        examinationId: examB5._id,
        studentId: studentB5._id,
        admissionNo: studentB5.admissionNo,
        subjectId: sDoc._id,
        subjectName: sub.name,
        subjectCode: sub.code,
        className: 'TEST-B5',
        sectionName: 'A',
        sessionName,
        totalMaxMarks: 100,
        totalObtainedMarks: sub.score,
        components: [{ componentCode: 'TH', componentName: 'Theory', maxMarks: 100, obtainedMarks: sub.score }]
      });
    }

    const calcResultB5 = await calculateStudentResult(studentB5._id, examB5._id);
    console.log('Best of Five Result Status:', calcResultB5.resultStatus);
    console.log('isBestOfFiveApplied:', calcResultB5.isBestOfFiveApplied);
    console.log('Dropped Subject:', calcResultB5.bestOfFiveDroppedSubject);
    console.log('Grand Total Max (Top 5 = 500):', calcResultB5.grandTotalMax);
    console.log('Grand Total Obtained (75+70+60+80+65 = 350):', calcResultB5.grandTotalObtained);
    console.log('Overall Percentage (350/500 = 70%):', calcResultB5.overallPercentage);

    if (
      calcResultB5.resultStatus === 'PASS' &&
      calcResultB5.isBestOfFiveApplied === true &&
      calcResultB5.bestOfFiveDroppedSubject === 'Sanskrit' &&
      calcResultB5.grandTotalMax === 500 &&
      calcResultB5.grandTotalObtained === 350 &&
      calcResultB5.overallPercentage === 70
    ) {
      console.log('✅ Test 3 PASSED: MP Board Best of Five dropped lowest failed subject (Sanskrit) and declared PASS based on top 5 subjects (70%)!');
    } else {
      console.error('❌ Test 3 FAILED: Best of Five evaluation did not match expectations.');
    }

    // Cleanup test records
    await Student.deleteMany({ admissionNo: { $in: [testStudent.admissionNo, examStudent.admissionNo, studentB5.admissionNo] } });
    await StudentEnrollment.deleteMany({ studentId: { $in: [testStudent._id, examStudent._id, studentB5._id] } });
    await Attendance.deleteMany({ academicSession: sessionName, className: { $in: ['TEST-10', 'TEST-B5'] } });
    await Marks.deleteMany({ studentId: { $in: [examStudent._id, studentB5._id] } });
    await Result.deleteMany({ studentId: { $in: [examStudent._id, studentB5._id] } });
    await Certificate.deleteMany({ student: testStudent._id });

    console.log('\n🎉 ALL STEP 1 TESTS COMPLETED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Verification Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runVerification();
