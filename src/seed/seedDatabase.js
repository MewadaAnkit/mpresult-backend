const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const AcademicSession = require('../models/AcademicSession');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Stream = require('../models/Stream');
const Subject = require('../models/Subject');
const SubjectCombination = require('../models/SubjectCombination');
const GradeRule = require('../models/GradeRule');
const PassingRule = require('../models/PassingRule');
const ExaminationScheme = require('../models/ExaminationScheme');
const Examination = require('../models/Examination');
const ExamSchedule = require('../models/ExamSchedule');
const Student = require('../models/Student');
const StudentEnrollment = require('../models/StudentEnrollment');
const Settings = require('../models/Settings');

// ERP Models
const AdmissionInquiry = require('../models/AdmissionInquiry');
const Staff = require('../models/Staff');
const TeacherAllocation = require('../models/TeacherAllocation');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const Homework = require('../models/Homework');
const FeeHead = require('../models/FeeHead');
const FeeStructure = require('../models/FeeStructure');
const StudentFeeLedger = require('../models/StudentFeeLedger');
const FeePayment = require('../models/FeePayment');
const Announcement = require('../models/Announcement');
const Certificate = require('../models/Certificate');

const { ROLES } = require('../constants/roles');
const { CLASS_MODES, COMPONENT_TYPES, EXAMINATION_TYPES } = require('../constants/examinationTypes');
const { seedAllClassSubjects } = require('./subjectSeeder');

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mp_result_management';
    console.log(`Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Database connected successfully for seeding.');

    // 1. Clean existing collections in MP DB only
    await Promise.all([
      User.deleteMany(),
      AcademicSession.deleteMany(),
      Class.deleteMany(),
      Section.deleteMany(),
      Stream.deleteMany(),
      Subject.deleteMany(),
      SubjectCombination.deleteMany(),
      GradeRule.deleteMany(),
      PassingRule.deleteMany(),
      ExaminationScheme.deleteMany(),
      Student.deleteMany(),
      StudentEnrollment.deleteMany(),
      Settings.deleteMany(),
      AdmissionInquiry.deleteMany(),
      Staff.deleteMany(),
      TeacherAllocation.deleteMany(),
      Attendance.deleteMany(),
      Timetable.deleteMany(),
      Homework.deleteMany(),
      FeeHead.deleteMany(),
      FeeStructure.deleteMany(),
      StudentFeeLedger.deleteMany(),
      FeePayment.deleteMany(),
      Announcement.deleteMany(),
      Certificate.deleteMany(),
      Examination.deleteMany(),
      ExamSchedule.deleteMany()
    ]);
    console.log('Cleaned old MP database records.');

    // 2. Create Users
    const adminUser = await User.create({
      name: 'Dr. Rajesh Sharma (Administrator)',
      email: 'admin@mpschool.edu.in',
      password: 'admin123',
      role: ROLES.ADMIN,
      phone: '9826012345',
      designation: 'System Administrator & IT Head'
    });

    const principalUser = await User.create({
      name: 'Smt. Vandana Mishra',
      email: 'principal@mpschool.edu.in',
      password: 'principal123',
      role: ROLES.PRINCIPAL,
      phone: '9826023456',
      designation: 'Principal'
    });

    const examIncharge = await User.create({
      name: 'Shri Anil Chouhan',
      email: 'exam@mpschool.edu.in',
      password: 'exam123',
      role: ROLES.EXAM_INCHARGE,
      phone: '9826034567',
      designation: 'Exam In-Charge & PGT Physics'
    });

    const teacher = await User.create({
      name: 'Pooja Verma',
      email: 'teacher@mpschool.edu.in',
      password: 'teacher123',
      role: ROLES.TEACHER,
      phone: '9826045678',
      designation: 'TGT Mathematics',
      assignedClasses: ['9', '10']
    });

    const accountantUser = await User.create({
      name: 'Rameshwar Patidar (Senior Accountant)',
      email: 'accountant@mpschool.edu.in',
      password: 'accountant123',
      role: ROLES.ACCOUNTANT,
      phone: '9826056789',
      designation: 'Head Accountant & Fee Officer'
    });

    const parentUser = await User.create({
      name: 'Suresh Kumar Sharma (Parent)',
      email: 'parent@mpschool.edu.in',
      password: 'parent123',
      role: ROLES.PARENT,
      phone: '9826112233',
      designation: 'Guardian'
    });

    console.log('Created Users (Admin, Principal, Exam In-Charge, Teacher, Accountant, Parent).');

    // 3. Create Academic Sessions
    const currentSession = await AcademicSession.create({
      sessionName: '2025-26',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      isCurrent: true,
      description: 'Academic Session 2025-2026 (Active)',
      createdBy: adminUser._id
    });

    await AcademicSession.create({
      sessionName: '2024-25',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      isCurrent: false,
      description: 'Academic Session 2024-2025 (Archived)',
      createdBy: adminUser._id
    });

    console.log('Created Academic Sessions.');

    // 4. Create Streams
    const scienceStream = await Stream.create({
      streamName: 'Science',
      streamCode: 'SCI',
      description: 'Physics, Chemistry, Mathematics / Biology'
    });

    const commerceStream = await Stream.create({
      streamName: 'Commerce',
      streamCode: 'COMM',
      description: 'Accountancy, Business Studies, Economics, Mathematics'
    });

    const artsStream = await Stream.create({
      streamName: 'Arts / Humanities',
      streamCode: 'ARTS',
      description: 'History, Political Science, Geography, Economics'
    });

    console.log('Created Streams (Science, Commerce, Arts).');

    // 5. Create Classes
    const classConfigs = [
      { className: '1', displayName: 'Class 1st (Primary)', numericLevel: 1, classMode: CLASS_MODES.PRIMARY_SCHOOL, order: 1 },
      { className: '2', displayName: 'Class 2nd (Primary)', numericLevel: 2, classMode: CLASS_MODES.PRIMARY_SCHOOL, order: 2 },
      { className: '3', displayName: 'Class 3rd (Primary)', numericLevel: 3, classMode: CLASS_MODES.PRIMARY_SCHOOL, order: 3 },
      { className: '4', displayName: 'Class 4th (Primary)', numericLevel: 4, classMode: CLASS_MODES.PRIMARY_SCHOOL, order: 4 },
      { className: '5', displayName: 'Class 5th (Board / External Authority)', numericLevel: 5, classMode: CLASS_MODES.EXTERNAL_AUTHORITY, isExternalBoard: true, order: 5 },
      { className: '6', displayName: 'Class 6th (Middle)', numericLevel: 6, classMode: CLASS_MODES.MIDDLE_SCHOOL, order: 6 },
      { className: '7', displayName: 'Class 7th (Middle)', numericLevel: 7, classMode: CLASS_MODES.MIDDLE_SCHOOL, order: 7 },
      { className: '8', displayName: 'Class 8th (Board / External Authority)', numericLevel: 8, classMode: CLASS_MODES.EXTERNAL_AUTHORITY, isExternalBoard: true, order: 8 },
      { className: '9', displayName: 'Class 9th (MP Academic Mode)', numericLevel: 9, classMode: CLASS_MODES.MP_ACADEMIC, order: 9 },
      { className: '10', displayName: 'Class 10th (MP High School Board)', numericLevel: 10, classMode: CLASS_MODES.MP_BOARD_EXTERNAL, isExternalBoard: true, order: 10 },
      { className: '11', displayName: 'Class 11th (Higher Secondary Streams)', numericLevel: 11, classMode: CLASS_MODES.MP_STREAM_ACADEMIC, hasStreams: true, order: 11 }
    ];

    const createdClasses = {};
    for (const c of classConfigs) {
      createdClasses[c.className] = await Class.create(c);
    }
    console.log('Created Classes 1 through 11.');

    // 6. Create Sections
    for (const cName of Object.keys(createdClasses)) {
      await Section.create({
        classId: createdClasses[cName]._id,
        className: cName,
        sectionName: 'A',
        roomNumber: `Room-${100 + Number(cName)}`,
        classTeacher: teacher._id,
        classTeacherName: teacher.name
      });
      await Section.create({
        classId: createdClasses[cName]._id,
        className: cName,
        sectionName: 'B',
        roomNumber: `Room-${200 + Number(cName)}`
      });
    }
    console.log('Created Sections A and B for all classes.');

    // 7. Create Grade Rules (MP Board 8-Point Scale)
    const mpGradeRule = await GradeRule.create({
      ruleName: 'MP Board Standard 8-Point Grading Scale',
      ruleCode: 'MP_8_POINT',
      scaleType: '8_POINT',
      isDefault: true,
      boundaries: [
        { grade: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 10, description: 'Outstanding' },
        { grade: 'A', minPercentage: 80, maxPercentage: 89.99, gradePoint: 9, description: 'Excellent' },
        { grade: 'B+', minPercentage: 70, maxPercentage: 79.99, gradePoint: 8, description: 'Very Good' },
        { grade: 'B', minPercentage: 60, maxPercentage: 69.99, gradePoint: 7, description: 'Good' },
        { grade: 'C+', minPercentage: 50, maxPercentage: 59.99, gradePoint: 6, description: 'Above Average' },
        { grade: 'C', minPercentage: 40, maxPercentage: 49.99, gradePoint: 5, description: 'Average' },
        { grade: 'D', minPercentage: 33, maxPercentage: 39.99, gradePoint: 4, description: 'Pass' },
        { grade: 'E', minPercentage: 0, maxPercentage: 32.99, gradePoint: 0, description: 'Needs Improvement / Fail' }
      ]
    });

    // 8. Create Passing Rules
    const mpPassingRule = await PassingRule.create({
      ruleName: 'MP Board Standard Passing Rule (33% Aggregate + Separate Components)',
      ruleCode: 'MP_PASS_33',
      overallMinPercentage: 33,
      subjectMinPercentage: 33,
      requireComponentPassing: true,
      componentRules: [
        { componentCode: 'TH', minPercentage: 33, isRequiredToPass: true },
        { componentCode: 'PR', minPercentage: 33, isRequiredToPass: true }
      ],
      graceMarksPolicy: {
        allowGraceMarks: true,
        maxGraceMarksPerSubject: 5,
        maxGraceMarksTotal: 10
      },
      supplementaryRules: {
        allowSupplementary: true,
        maxFailedSubjects: 2
      }
    });

    console.log('Created MP Grade and Passing Rules.');

    // 9. Create Examination Schemes
    // Scheme A: Class 9 Pattern (Theory 75, Practical 25)
    const schemeCls9 = await ExaminationScheme.create({
      schemeName: 'MP Class 9 Annual Exam Pattern',
      schemeCode: 'MP_CLS9_ANNUAL',
      applicableClasses: ['9'],
      examType: EXAMINATION_TYPES.SUMMATIVE,
      components: [
        { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 75, passingMarks: 25, required: true, order: 1 },
        { name: 'Practical / Project Assessment', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, defaultMaxMarks: 25, passingMarks: 8, required: true, order: 2 }
      ],
      totalMaxMarks: 100,
      passingRuleId: mpPassingRule._id,
      gradeRuleId: mpGradeRule._id,
      allowSubjectComponentOverride: true,
      description: 'Annual Evaluation Pattern for MP Board Class 9 (75 Theory + 25 Practical/Project)'
    });

    // Scheme B: Class 11 Higher Secondary Pattern
    const schemeCls11 = await ExaminationScheme.create({
      schemeName: 'MP Class 11 Stream Academic Pattern',
      schemeCode: 'MP_CLS11_STREAM_ANNUAL',
      applicableClasses: ['11'],
      applicableStreams: ['SCIENCE', 'COMMERCE', 'ARTS'],
      examType: EXAMINATION_TYPES.SUMMATIVE,
      components: [
        { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 70, passingMarks: 23, required: true, order: 1 },
        { name: 'Practical / Project Work', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, defaultMaxMarks: 30, passingMarks: 10, required: true, order: 2 }
      ],
      totalMaxMarks: 100,
      passingRuleId: mpPassingRule._id,
      gradeRuleId: mpGradeRule._id,
      allowSubjectComponentOverride: true,
      description: 'Class 11 Pattern with Subject-Specific Overrides (70/30 for Practicals, 80/20 for Languages/Commerce)'
    });

    console.log('Created Examination Schemes for Class 9 and Class 11.');

    // 10. Create Subjects
    // Class 9 Subjects
    const subHindi9 = await Subject.create({
      subjectName: 'Hindi (Special)',
      subjectCode: 'HIN_01',
      applicableClasses: ['9'],
      subjectType: 'COMPULSORY',
      totalMaxMarks: 100,
      components: [
        { name: 'Theory', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
        { name: 'Internal Project', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 25, passingMarks: 8 }
      ],
      displayOrder: 1
    });

    const subEng9 = await Subject.create({
      subjectName: 'English (General)',
      subjectCode: 'ENG_02',
      applicableClasses: ['9'],
      subjectType: 'COMPULSORY',
      totalMaxMarks: 100,
      components: [
        { name: 'Theory', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
        { name: 'Internal Project', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 25, passingMarks: 8 }
      ],
      displayOrder: 2
    });

    const subMath9 = await Subject.create({
      subjectName: 'Mathematics',
      subjectCode: 'MATH_03',
      applicableClasses: ['9'],
      subjectType: 'COMPULSORY',
      totalMaxMarks: 100,
      components: [
        { name: 'Theory', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
        { name: 'Practical Assessment', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 25, passingMarks: 8 }
      ],
      displayOrder: 3
    });

    const subSci9 = await Subject.create({
      subjectName: 'Science',
      subjectCode: 'SCI_04',
      applicableClasses: ['9'],
      subjectType: 'COMPULSORY',
      totalMaxMarks: 100,
      components: [
        { name: 'Theory', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
        { name: 'Practical Lab Work', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 25, passingMarks: 8 }
      ],
      displayOrder: 4
    });

    const subSSt9 = await Subject.create({
      subjectName: 'Social Science',
      subjectCode: 'SST_05',
      applicableClasses: ['9'],
      subjectType: 'COMPULSORY',
      totalMaxMarks: 100,
      components: [
        { name: 'Theory', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
        { name: 'Project / Map Work', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 25, passingMarks: 8 }
      ],
      displayOrder: 5
    });

    // Class 11 Science Subjects (70 Theory + 30 Practical for Physics/Chemistry, 80/20 for Hindi/English/Maths)
    const subPhy11 = await Subject.create({
      subjectName: 'Physics',
      subjectCode: 'PHY_11',
      applicableClasses: ['11'],
      streamName: 'Science',
      streamId: scienceStream._id,
      subjectType: 'COMPULSORY',
      hasPractical: true,
      totalMaxMarks: 100,
      components: [
        { name: 'Theory', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 70, passingMarks: 23 },
        { name: 'Practical Lab', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 30, passingMarks: 10 }
      ],
      displayOrder: 3
    });

    const subChem11 = await Subject.create({
      subjectName: 'Chemistry',
      subjectCode: 'CHEM_11',
      applicableClasses: ['11'],
      streamName: 'Science',
      streamId: scienceStream._id,
      subjectType: 'COMPULSORY',
      hasPractical: true,
      totalMaxMarks: 100,
      components: [
        { name: 'Theory', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 70, passingMarks: 23 },
        { name: 'Practical Lab', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 30, passingMarks: 10 }
      ],
      displayOrder: 4
    });

    const subMath11 = await Subject.create({
      subjectName: 'Higher Mathematics',
      subjectCode: 'HMATH_11',
      applicableClasses: ['11'],
      streamName: 'Science',
      streamId: scienceStream._id,
      subjectType: 'ELECTIVE',
      totalMaxMarks: 100,
      components: [
        { name: 'Theory', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
        { name: 'Internal Assessment', code: 'PR', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 20, passingMarks: 7 }
      ],
      displayOrder: 5
    });

    // Class 11 Commerce Subjects
    const subAcc11 = await Subject.create({
      subjectName: 'Accountancy',
      subjectCode: 'ACC_11',
      applicableClasses: ['11'],
      streamName: 'Commerce',
      streamId: commerceStream._id,
      totalMaxMarks: 100,
      components: [
        { name: 'Theory', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
        { name: 'Project Assessment', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 20, passingMarks: 7 }
      ],
      displayOrder: 3
    });

    const subBST11 = await Subject.create({
      subjectName: 'Business Studies',
      subjectCode: 'BST_11',
      applicableClasses: ['11'],
      streamName: 'Commerce',
      streamId: commerceStream._id,
      totalMaxMarks: 100,
      components: [
        { name: 'Theory', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
        { name: 'Project Assessment', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 20, passingMarks: 7 }
      ],
    console.log('Created Subjects with distinct Theory/Practical/Project splits.');

    // Seed all standard MP Board curriculum subjects across Classes 1 through 12
    await seedAllClassSubjects({ verbose: true });

    // 11. Create Subject Combinations for Class 11
    const pcmCombo = await SubjectCombination.create({
      combinationName: 'Class 11 Science (PCM)',
      combinationCode: 'CLS11_SCI_PCM',
      className: '11',
      streamId: scienceStream._id,
      streamName: 'Science',
      compulsorySubjects: [subPhy11._id, subChem11._id, subMath11._id]
    });

    const commCombo = await SubjectCombination.create({
      combinationName: 'Class 11 Commerce',
      combinationCode: 'CLS11_COMM',
      className: '11',
      streamId: commerceStream._id,
      streamName: 'Commerce',
      compulsorySubjects: [subAcc11._id, subBST11._id]
    });

    console.log('Created Subject Combinations for Class 11 Streams.');

    // 12. Create Sample Students
    const student1 = await Student.create({
      admissionNo: 'MP2025001',
      samagraId: '128490312',
      mpBseRollNo: '925001',
      studentName: 'Aarav Sharma',
      fatherName: 'Mahesh Sharma',
      motherName: 'Sunita Sharma',
      dob: new Date('2010-06-15'),
      gender: 'MALE',
      category: 'GEN',
      mobileNo: '9826112233',
      address: 'Plot 45, Arera Colony, Bhopal, MP',
      currentSession: '2025-26',
      currentClass: '9',
      currentSection: 'A',
      currentRollNo: '1',
      createdBy: adminUser._id
    });

    await StudentEnrollment.create({
      studentId: student1._id,
      admissionNo: student1.admissionNo,
      sessionName: '2025-26',
      className: '9',
      sectionName: 'A',
      rollNo: '1',
      status: 'ACTIVE'
    });

    const student2 = await Student.create({
      admissionNo: 'MP2025002',
      samagraId: '128490313',
      mpBseRollNo: '925002',
      studentName: 'Priya Patel',
      fatherName: 'Dinesh Patel',
      motherName: 'Kavita Patel',
      dob: new Date('2010-08-22'),
      gender: 'FEMALE',
      category: 'OBC',
      mobileNo: '9826223344',
      address: '12, MP Nagar Zone 2, Bhopal, MP',
      currentSession: '2025-26',
      currentClass: '9',
      currentSection: 'A',
      currentRollNo: '2',
      createdBy: adminUser._id
    });

    await StudentEnrollment.create({
      studentId: student2._id,
      admissionNo: student2.admissionNo,
      sessionName: '2025-26',
      className: '9',
      sectionName: 'A',
      rollNo: '2',
      status: 'ACTIVE'
    });

    const student3 = await Student.create({
      admissionNo: 'MP2025101',
      samagraId: '128490888',
      mpBseRollNo: '112501',
      studentName: 'Devendra Singh Tomar',
      fatherName: 'Raghavendra Singh',
      motherName: 'Meera Devi',
      dob: new Date('2008-03-10'),
      gender: 'MALE',
      category: 'GEN',
      mobileNo: '9826334455',
      address: 'Govindpura, Bhopal, MP',
      currentSession: '2025-26',
      currentClass: '11',
      currentSection: 'A',
      currentRollNo: '1',
      currentStream: 'Science',
      createdBy: adminUser._id
    });

    await StudentEnrollment.create({
      studentId: student3._id,
      admissionNo: student3.admissionNo,
      sessionName: '2025-26',
      className: '11',
      sectionName: 'A',
      rollNo: '1',
      streamId: scienceStream._id,
      streamName: 'Science',
      subjectCombinationId: pcmCombo._id,
      status: 'ACTIVE'
    });

    console.log('Created Sample Students and Academic Enrollments.');

    // 13. Create School ERP Seed Data
    // Fee Heads
    const tuitionHead = await FeeHead.create({ name: 'Tuition Fee', code: 'TUTION', description: 'Academic tuition fee per term' });
    const admissionHead = await FeeHead.create({ name: 'Admission & Registration Fee', code: 'ADM', description: 'One-time admission charge' });
    const examFeeHead = await FeeHead.create({ name: 'Examination & Lab Fee', code: 'EXAM', description: 'Term assessment fee' });
    const annualHead = await FeeHead.create({ name: 'Annual Development Fee', code: 'ANNUAL', description: 'Infrastructure & Library charge' });
    const computerHead = await FeeHead.create({ name: 'Computer & Smart Class Fee', code: 'COMP', description: 'IT and smart board charges' });

    // Fee Structure for Class 9
    const feeStruct9 = await FeeStructure.create({
      academicSession: '2025-26',
      className: '9',
      title: 'Class 9 Standard Fee Structure 2025-26',
      installments: [
        {
          installmentName: 'Term 1 (April)',
          dueDate: new Date('2025-04-15'),
          items: [
            { feeHead: tuitionHead._id, headName: 'Tuition Fee', amount: 6000 },
            { feeHead: admissionHead._id, headName: 'Admission Fee', amount: 2000 },
            { feeHead: annualHead._id, headName: 'Annual Development Fee', amount: 2500 }
          ],
          totalAmount: 10500
        },
        {
          installmentName: 'Term 2 (August)',
          dueDate: new Date('2025-08-15'),
          items: [
            { feeHead: tuitionHead._id, headName: 'Tuition Fee', amount: 6000 },
            { feeHead: examFeeHead._id, headName: 'Examination Fee', amount: 1500 },
            { feeHead: computerHead._id, headName: 'Computer Fee', amount: 1000 }
          ],
          totalAmount: 8500
        },
        {
          installmentName: 'Term 3 (December)',
          dueDate: new Date('2025-12-15'),
          items: [
            { feeHead: tuitionHead._id, headName: 'Tuition Fee', amount: 6000 },
            { feeHead: examFeeHead._id, headName: 'Final Exam Fee', amount: 1000 }
          ],
          totalAmount: 7000
        }
      ],
      annualTotal: 26000
    });

    // Student Fee Ledgers & Payments
    await StudentFeeLedger.create({
      student: student1._id,
      admissionNo: student1.admissionNo,
      studentName: student1.studentName,
      academicSession: '2025-26',
      className: '9',
      sectionName: 'A',
      totalFee: 26000,
      discountAmount: 2000,
      discountReason: 'Sibling concession (Merit 10%)',
      netFee: 24000,
      paidAmount: 10500,
      balanceAmount: 13500,
      status: 'PARTIAL',
      lastPaymentDate: new Date('2025-04-10')
    });

    await FeePayment.create({
      receiptNo: 'REC-2025-00001',
      student: student1._id,
      admissionNo: student1.admissionNo,
      studentName: student1.studentName,
      academicSession: '2025-26',
      className: '9',
      sectionName: 'A',
      amountPaid: 10500,
      paymentMode: 'UPI',
      transactionRef: 'UPI-AXIS-982348123',
      items: [
        { headName: 'Tuition Fee', amount: 6000 },
        { headName: 'Admission Fee', amount: 2000 },
        { headName: 'Annual Development', amount: 2500 }
      ],
      remarks: 'Paid via GPay at counter',
      collectedByName: 'Rameshwar Patidar (Senior Accountant)',
      paymentDate: new Date('2025-04-10')
    });

    // Staff Records
    const staff1 = await Staff.create({
      employeeId: 'EMP-0001',
      fullName: 'Pooja Verma',
      email: 'pooja.verma@mpschool.edu.in',
      phone: '9826045678',
      gender: 'FEMALE',
      designation: 'TGT Mathematics',
      department: 'ACADEMIC',
      qualification: 'M.Sc (Mathematics), B.Ed',
      experienceYears: 7,
      joiningDate: new Date('2019-07-01'),
      salary: 42000,
      address: 'Arera Colony, Bhopal, MP'
    });

    const staff2 = await Staff.create({
      employeeId: 'EMP-0002',
      fullName: 'Dr. Suresh Chandra Malviya',
      email: 'suresh.malviya@mpschool.edu.in',
      phone: '9826055566',
      gender: 'MALE',
      designation: 'PGT Science & Chemistry',
      department: 'ACADEMIC',
      qualification: 'Ph.D, M.Sc (Chemistry), B.Ed',
      experienceYears: 12,
      joiningDate: new Date('2015-06-15'),
      salary: 58000,
      address: 'Shahpura, Bhopal, MP'
    });

    // Teacher Allocations
    await TeacherAllocation.create({
      academicSession: '2025-26',
      teacher: staff1._id,
      teacherName: 'Pooja Verma',
      className: '9',
      sectionName: 'A',
      subjectCode: 'MATH_09',
      subjectName: 'Mathematics (गणित)',
      isClassTeacher: true
    });

    // Admission Inquiries
    await AdmissionInquiry.create({
      inquiryNo: 'INQ-2025-0001',
      academicSession: '2025-26',
      studentName: 'Harshit Saxena',
      gender: 'MALE',
      dob: new Date('2010-08-14'),
      appliedClass: '9',
      previousSchool: 'St. Joseph Convent, Bhopal',
      fatherName: 'Deepak Saxena',
      motherName: 'Sunita Saxena',
      guardianPhone: '9826778899',
      guardianEmail: 'deepak.saxena@gmail.com',
      address: 'Kolar Road, Bhopal',
      status: 'UNDER_REVIEW',
      notes: [{ text: 'Entrance test cleared with 84%. Document verification pending.', addedBy: 'Admin Office' }]
    });

    await AdmissionInquiry.create({
      inquiryNo: 'INQ-2025-0002',
      academicSession: '2025-26',
      studentName: 'Ananya Chouhan',
      gender: 'FEMALE',
      dob: new Date('2011-02-20'),
      appliedClass: '8',
      previousSchool: 'Kendriya Vidyalaya No. 1, Bhopal',
      fatherName: 'Rajendra Chouhan',
      guardianPhone: '9826114477',
      address: 'MP Nagar Zone II, Bhopal',
      status: 'APPROVED',
      notes: [{ text: 'Admission approved by Principal. Fee deposit awaited.', addedBy: 'Principal Office' }]
    });

    // Daily Attendance
    await Attendance.create({
      academicSession: '2025-26',
      className: '9',
      sectionName: 'A',
      date: new Date(),
      totalStudents: 1,
      presentCount: 1,
      absentCount: 0,
      lateCount: 0,
      records: [
        {
          student: student1._id,
          admissionNo: student1.admissionNo,
          rollNo: student1.currentRollNo,
          studentName: student1.studentName,
          status: 'PRESENT',
          remarks: 'On time'
        }
      ],
      takenByName: 'Pooja Verma (Class Teacher)'
    });

    // Timetable
    await Timetable.create({
      academicSession: '2025-26',
      className: '9',
      sectionName: 'A',
      dayOfWeek: 'MONDAY',
      periods: [
        { periodNumber: 1, startTime: '08:30', endTime: '09:15', subjectCode: 'HIN_09', subjectName: 'Hindi (हिंदी)', teacherName: 'Smt. Kavita Sharma', roomNo: 'Room 101' },
        { periodNumber: 2, startTime: '09:15', endTime: '10:00', subjectCode: 'MATH_09', subjectName: 'Mathematics (गणित)', teacherName: 'Pooja Verma', roomNo: 'Room 101' },
        { periodNumber: 3, startTime: '10:00', endTime: '10:45', subjectCode: 'SCI_09', subjectName: 'Science (विज्ञान)', teacherName: 'Dr. Suresh Malviya', roomNo: 'Lab 2' },
        { periodNumber: 4, startTime: '10:45', endTime: '11:15', isBreak: true, startTime: '10:45', endTime: '11:15', subjectName: 'Recess / Lunch Break' },
        { periodNumber: 5, startTime: '11:15', endTime: '12:00', subjectCode: 'ENG_09', subjectName: 'English (अंग्रेजी)', teacherName: 'Anil Chouhan', roomNo: 'Room 101' }
      ]
    });

    // Homework
    await Homework.create({
      academicSession: '2025-26',
      className: '9',
      sectionName: 'A',
      subjectName: 'Mathematics',
      title: 'Polynomials & Algebraic Identities Exercise 2.4',
      description: 'Complete questions 1 to 12 from NCERT Textbook Chapter 2 in homework notebook.',
      assignedDate: new Date(),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      assignedByName: 'Pooja Verma'
    });

    // Announcements
    await Announcement.create({
      title: 'Important: Half-Yearly Examination Schedule 2025-26 Published',
      content: 'All students and parents are notified that the MP Board pattern Half-Yearly examinations will commence from September 15th. Admit cards and date sheets have been published in the examination portal.',
      audience: 'ALL',
      priority: 'HIGH',
      academicSession: '2025-26',
      authorName: 'Principal Office'
    });

    await Announcement.create({
      title: 'Fee Installment 2 (Term 2) Due Date Notice',
      content: 'Dear Parents, please deposit Term 2 fees on or before August 15th to avoid late fee penalties. UPI, Netbanking and Cash counters are open from 9:00 AM to 2:00 PM.',
      audience: 'PARENTS',
      priority: 'NORMAL',
      academicSession: '2025-26',
      authorName: 'Accounts Department'
    });

    // Certificates
    await Certificate.create({
      certificateNo: 'BON-2025-0001',
      certificateType: 'BONAFIDE',
      student: student1._id,
      studentName: student1.studentName,
      admissionNo: student1.admissionNo,
      academicSession: '2025-26',
      className: '9',
      sectionName: 'A',
      conduct: 'Exemplary',
      feeClearedTill: 'March 2026',
      issuedByName: 'Smt. Vandana Mishra (Principal)'
    });

    // 13.5 Create Examination & Exam Timetable Schedules
    const halfYearlyExam = await Examination.create({
      examName: 'Half-Yearly Examination 2025-26 (अर्धवार्षिक परीक्षा)',
      examCode: 'HY_EXAM_2025',
      sessionName: '2025-26',
      examType: 'SUMMATIVE',
      schemeId: schemeCls9._id,
      applicableClasses: ['9', '10', '11', '12'],
      startDate: new Date('2025-09-15'),
      endDate: new Date('2025-09-24'),
      description: 'MP Board Pattern Official Half-Yearly Summative Assessment'
    });

    // Seed Exam Schedule entries for Class 9
    await ExamSchedule.create([
      {
        examination: halfYearlyExam._id,
        examinationName: halfYearlyExam.examName,
        academicSession: '2025-26',
        className: '9',
        sectionName: 'ALL',
        subject: subHindi9._id,
        subjectName: 'Hindi (हिंदी)',
        subjectCode: 'HIN_01',
        examDate: new Date('2025-09-15'),
        dayOfWeek: 'Monday',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        durationMinutes: 180,
        examType: 'THEORY',
        roomOrHall: 'Examination Hall A (Ground Floor)',
        invigilatorName: 'Smt. Vandana Mishra',
        instructions: 'Report 30 minutes before time. Bring School ID and Admit Card.',
        status: 'PUBLISHED'
      },
      {
        examination: halfYearlyExam._id,
        examinationName: halfYearlyExam.examName,
        academicSession: '2025-26',
        className: '9',
        sectionName: 'ALL',
        subject: subEng9._id,
        subjectName: 'English (अंग्रेजी)',
        subjectCode: 'ENG_02',
        examDate: new Date('2025-09-17'),
        dayOfWeek: 'Wednesday',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        durationMinutes: 180,
        examType: 'THEORY',
        roomOrHall: 'Examination Hall A (Ground Floor)',
        invigilatorName: 'Anil Chouhan',
        instructions: 'Report 30 minutes before time. Bring School ID and Admit Card.',
        status: 'PUBLISHED'
      },
      {
        examination: halfYearlyExam._id,
        examinationName: halfYearlyExam.examName,
        academicSession: '2025-26',
        className: '9',
        sectionName: 'ALL',
        subject: subMath9._id,
        subjectName: 'Mathematics (गणित)',
        subjectCode: 'MATH_03',
        examDate: new Date('2025-09-19'),
        dayOfWeek: 'Friday',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        durationMinutes: 180,
        examType: 'THEORY',
        roomOrHall: 'Examination Hall A (Ground Floor)',
        invigilatorName: 'Pooja Verma',
        instructions: 'Scientific calculators are strictly prohibited. Geometry box allowed.',
        status: 'PUBLISHED'
      },
      {
        examination: halfYearlyExam._id,
        examinationName: halfYearlyExam.examName,
        academicSession: '2025-26',
        className: '9',
        sectionName: 'ALL',
        subject: subSci9._id,
        subjectName: 'Science (विज्ञान)',
        subjectCode: 'SCI_04',
        examDate: new Date('2025-09-22'),
        dayOfWeek: 'Monday',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        durationMinutes: 180,
        examType: 'THEORY',
        roomOrHall: 'Examination Hall A (Ground Floor)',
        invigilatorName: 'Rajesh Kumar Saxena',
        instructions: 'Report 30 minutes before time. Bring School ID and Admit Card.',
        status: 'PUBLISHED'
      },
      {
        examination: halfYearlyExam._id,
        examinationName: halfYearlyExam.examName,
        academicSession: '2025-26',
        className: '9',
        sectionName: 'ALL',
        subject: subSci9._id,
        subjectName: 'Science Practical & Lab Viva (विज्ञान प्रायोगिक)',
        subjectCode: 'SCI_04_PR',
        examDate: new Date('2025-09-24'),
        dayOfWeek: 'Wednesday',
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        durationMinutes: 180,
        examType: 'PRACTICAL',
        roomOrHall: 'Physics & Chemistry Lab 1',
        invigilatorName: 'Rajesh Kumar Saxena (External: Dr. S.K. Dixit)',
        instructions: 'Wear lab coat. Bring completed practical journal signed by teacher.',
        status: 'PUBLISHED'
      }
    ]);

    console.log('Created Complete School ERP Seed Dataset (Fees, Staff, Inquiries, Timetable, Homework, Exam Schedules, Notices, Certificates).');

    // 14. Create School Settings
    await Settings.create({
      schoolName: 'GOVERNMENT MODEL HIGHER SECONDARY SCHOOL OF EXCELLENCE',
      schoolHindiName: 'शासकीय उत्कृष्ट उच्चतर माध्यमिक विद्यालय, भोपाल',
      schoolAddress: 'Shivaji Nagar, Near MPBSE HQ, Bhopal, Madhya Pradesh - 462016',
      affiliationCode: 'MPBSE-SCH-712049',
      udiseCode: '23320108901',
      boardAffiliation: 'Affiliated to Board of Secondary Education, Madhya Pradesh (MPBSE)',
      phone: '+91 755 2551234',
      email: 'excellence.bhopal@mp.gov.in',
      website: 'https://mpbse.nic.in',
      currentSession: '2025-26',
      enablePublicResultPortal: true,
      allowPublicPdfDownload: true
    });

    console.log('Created Official MP School Settings.');
    console.log('=======================================================');
    console.log('  MP SCHOOL ERP & RMS SEEDING COMPLETED!');
    console.log('  Admin Login: admin@mpschool.edu.in / admin123');
    console.log('  Principal Login: principal@mpschool.edu.in / principal123');
    console.log('  Accountant Login: accountant@mpschool.edu.in / accountant123');
    console.log('  Teacher Login: teacher@mpschool.edu.in / teacher123');
    console.log('  Parent Login: parent@mpschool.edu.in / parent123');
    console.log('=======================================================');

    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seed();
