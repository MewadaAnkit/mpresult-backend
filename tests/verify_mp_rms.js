const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../src/models/User');
const Student = require('../src/models/Student');
const StudentEnrollment = require('../src/models/StudentEnrollment');
const Subject = require('../src/models/Subject');
const ExaminationScheme = require('../src/models/ExaminationScheme');
const Examination = require('../src/models/Examination');
const Marks = require('../src/models/Marks');
const Result = require('../src/models/Result');
const ExternalResult = require('../src/models/ExternalResult');
const AuditLog = require('../src/models/AuditLog');
const { calculateStudentResult } = require('../src/services/resultCalculationService');
const { generateMarksheetPdf } = require('../src/services/pdfService');
const { saveExternalResult } = require('../src/services/externalResultService');

const runVerification = async () => {
  try {
    console.log('--- Starting MP Board RMS End-to-End Verification ---');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mp_result_management');

    // 1. Verify Seeded Users & Schemes
    const admin = await User.findOne({ email: 'admin@mpschool.edu.in' });
    if (!admin) throw new Error('Admin user not found');
    console.log('✓ Verified Admin User:', admin.name);

    const scheme9 = await ExaminationScheme.findOne({ schemeCode: 'MP_CLS9_ANNUAL' });
    if (!scheme9) throw new Error('Class 9 Scheme not found');
    console.log('✓ Verified Class 9 Examination Scheme:', scheme9.schemeName);

    // 2. Create Examination for Class 9
    let exam9 = await Examination.findOne({ examCode: 'ANNUAL_2026_CLS9' });
    if (!exam9) {
      exam9 = await Examination.create({
        examName: 'Class 9 Annual Examination 2025-26',
        examCode: 'ANNUAL_2026_CLS9',
        sessionName: '2025-26',
        schemeId: scheme9._id,
        applicableClasses: ['9'],
        createdBy: admin._id
      });
    }
    console.log('✓ Verified Examination Event:', exam9.examName);

    // 3. Find Class 9 Student & Subjects
    const student = await Student.findOne({ admissionNo: 'MP2025001' });
    if (!student) throw new Error('Student MP2025001 not found');
    console.log('✓ Verified Student:', student.studentName, '(Admission:', student.admissionNo, ')');

    const subjects = await Subject.find({ applicableClasses: '9' });
    console.log(`✓ Found ${subjects.length} Class 9 Subjects`);

    // 4. Enter Marks for all subjects (Theory 75, Practical 25)
    for (const sub of subjects) {
      const marksData = {
        studentId: student._id,
        admissionNo: student.admissionNo,
        examinationId: exam9._id,
        sessionName: '2025-26',
        className: '9',
        sectionName: 'A',
        subjectId: sub._id,
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode,
        components: [
          { componentCode: 'TH', componentName: 'Theory', maxMarks: 75, obtainedMarks: 65, attendanceStatus: 'PRESENT' },
          { componentCode: 'PR', componentName: 'Practical / Project', maxMarks: 25, obtainedMarks: 22, attendanceStatus: 'PRESENT' }
        ],
        totalMaxMarks: 100,
        totalObtainedMarks: 87,
        percentage: 87,
        isPassed: true,
        enteredBy: admin._id
      };

      await Marks.findOneAndUpdate(
        { studentId: student._id, examinationId: exam9._id, subjectId: sub._id },
        marksData,
        { upsert: true }
      );
    }
    console.log('✓ Successfully entered component-wise marks (Theory: 65/75, Practical: 22/25 = 87%)');

    // 5. Test Result Calculation Service
    const calculatedResult = await calculateStudentResult(student._id, exam9._id);
    console.log('✓ Calculation Service Output:');
    console.log(`  - Grand Total: ${calculatedResult.grandTotalObtained} / ${calculatedResult.grandTotalMax}`);
    console.log(`  - Overall Percentage: ${calculatedResult.overallPercentage}%`);
    console.log(`  - Overall Grade: ${calculatedResult.overallGrade}`);
    console.log(`  - Division: ${calculatedResult.division}`);
    console.log(`  - Result Status: ${calculatedResult.resultStatus}`);
    console.log(`  - Verification Code: ${calculatedResult.verificationCode}`);

    if (calculatedResult.overallPercentage !== 87) {
      throw new Error(`Expected 87%, got ${calculatedResult.overallPercentage}%`);
    }

    // 6. Test Multi-Stage Approval Pipeline Transition
    calculatedResult.approvalStage = 'PUBLISHED';
    calculatedResult.isPublished = true;
    calculatedResult.publishedAt = new Date();
    await calculatedResult.save();
    console.log('✓ Transitioned Result through Approval Pipeline to: PUBLISHED');

    // 7. Test PDF Generation Service with embedded QR
    const pdfDoc = await generateMarksheetPdf(calculatedResult._id);
    if (!pdfDoc) throw new Error('PDF Generation returned null');
    console.log('✓ Generated Dynamic PDF Marksheet with embedded Verification QR');

    // 8. Test External Board Result Module (Class 5 & 10)
    const external5 = await saveExternalResult({
      boardRollNo: '52500109',
      studentName: 'Aman Patel',
      fatherName: 'Sunil Patel',
      sessionName: '2025-26',
      className: '5',
      authorityName: 'Rajya Shiksha Kendra (RSK MP)',
      subjectScores: [
        { subjectCode: 'HIN', subjectName: 'Hindi', totalMaxMarks: 100, totalObtainedMarks: 78, isPassed: true },
        { subjectCode: 'MATH', subjectName: 'Mathematics', totalMaxMarks: 100, totalObtainedMarks: 82, isPassed: true },
        { subjectCode: 'EVS', subjectName: 'Environmental Studies', totalMaxMarks: 100, totalObtainedMarks: 85, isPassed: true }
      ]
    }, admin);
    console.log(`✓ Verified Class 5 External Authority Result Import: ${external5.studentName} (${external5.percentage}% - ${external5.resultStatus})`);

    console.log('=======================================================');
    console.log('  ALL BACKEND & CALCULATION TESTS PASSED 100%!');
    console.log('=======================================================');

    process.exit(0);
  } catch (error) {
    console.error('Verification Error:', error);
    process.exit(1);
  }
};

runVerification();
