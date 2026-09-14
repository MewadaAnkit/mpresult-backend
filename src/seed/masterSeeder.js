const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Core Models
const User = require('../models/User');
const Staff = require('../models/Staff');
const TeacherAllocation = require('../models/TeacherAllocation');
const AcademicSession = require('../models/AcademicSession');
const Stream = require('../models/Stream');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const SubjectCombination = require('../models/SubjectCombination');
const GradeRule = require('../models/GradeRule');
const PassingRule = require('../models/PassingRule');
const ExaminationScheme = require('../models/ExaminationScheme');
const FeeHead = require('../models/FeeHead');
const Settings = require('../models/Settings');
const Student = require('../models/Student');
const StudentEnrollment = require('../models/StudentEnrollment');
const Examination = require('../models/Examination');
const Marks = require('../models/Marks');
const Result = require('../models/Result');
const FeeStructure = require('../models/FeeStructure');
const StudentFeeLedger = require('../models/StudentFeeLedger');
const FeePayment = require('../models/FeePayment');

const { ROLES } = require('../constants/roles');
const { CLASS_MODES, COMPONENT_TYPES, EXAMINATION_TYPES } = require('../constants/examinationTypes');
const { RESULT_STATUSES, APPROVAL_STAGES } = require('../constants/resultStatuses');

// ============================================================================
// 1. DEFAULT DEMO USERS & STAFF (1 per staff role)
// ============================================================================
const DEFAULT_SYSTEM_USERS = [
  {
    employeeId: 'EMP-001',
    name: 'Dr. Rajesh Sharma',
    email: 'admin@mpschool.edu.in',
    password: 'admin123',
    role: ROLES.ADMIN,
    phone: '9826012345',
    gender: 'MALE',
    designation: 'System Administrator & IT Head',
    cadre: 'OTHER',
    department: 'ADMINISTRATION',
    qualification: 'Ph.D, M.Tech (Computer Science)',
    experienceYears: 14,
    salary: 65000
  },
  {
    employeeId: 'EMP-002',
    name: 'Smt. Vandana Mishra',
    email: 'principal@mpschool.edu.in',
    password: 'principal123',
    role: ROLES.PRINCIPAL,
    phone: '9826023456',
    gender: 'FEMALE',
    designation: 'Principal',
    cadre: 'OTHER',
    department: 'ADMINISTRATION',
    qualification: 'M.Sc, M.Ed',
    experienceYears: 20,
    salary: 78000
  },
  {
    employeeId: 'EMP-003',
    name: 'Shri Anil Chouhan',
    email: 'exam@mpschool.edu.in',
    password: 'exam123',
    role: ROLES.EXAM_INCHARGE,
    phone: '9826034567',
    gender: 'MALE',
    designation: 'Examination Controller & PGT Physics',
    cadre: 'PGT',
    department: 'ACADEMIC',
    qualification: 'M.Sc Physics, B.Ed',
    experienceYears: 12,
    salary: 52000
  },
  {
    employeeId: 'EMP-004',
    name: 'Pooja Verma',
    email: 'teacher@mpschool.edu.in',
    password: 'teacher123',
    role: ROLES.TEACHER,
    phone: '9826045678',
    gender: 'FEMALE',
    designation: 'TGT Mathematics',
    cadre: 'TGT',
    department: 'ACADEMIC',
    qualification: 'M.Sc Mathematics, B.Ed',
    experienceYears: 8,
    salary: 42000,
    assignedClasses: ['9', '10']
  },
  {
    employeeId: 'EMP-005',
    name: 'Rameshwar Patidar',
    email: 'accountant@mpschool.edu.in',
    password: 'accountant123',
    role: ROLES.ACCOUNTANT,
    phone: '9826056789',
    gender: 'MALE',
    designation: 'Head Accountant & Fee Officer',
    cadre: 'OTHER',
    department: 'ACCOUNTS',
    qualification: 'M.Com, CA-Inter',
    experienceYears: 9,
    salary: 38000
  }
];

// ============================================================================
// 2. ACADEMIC SESSIONS
// ============================================================================
const DEFAULT_ACADEMIC_SESSIONS = [
  {
    sessionName: '2024-25',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2025-03-31'),
    isCurrent: false,
    description: 'Academic Session 2024-2025 (Archived)'
  },
  {
    sessionName: '2025-26',
    startDate: new Date('2025-04-01'),
    endDate: new Date('2026-03-31'),
    isCurrent: true,
    description: 'Academic Session 2025-2026 (Active)'
  },
  {
    sessionName: '2026-27',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2027-03-31'),
    isCurrent: false,
    description: 'Academic Session 2026-2027 (Upcoming)'
  }
];

// ============================================================================
// 3. HIGHER SECONDARY STREAMS (Classes 11 & 12)
// ============================================================================
const DEFAULT_STREAMS = [
  {
    streamName: 'Science',
    streamCode: 'SCI',
    description: 'Physics, Chemistry, Mathematics / Biology'
  },
  {
    streamName: 'Commerce',
    streamCode: 'COMM',
    description: 'Accountancy, Business Studies, Economics, Mathematics'
  },
  {
    streamName: 'Arts / Humanities',
    streamCode: 'ARTS',
    description: 'History, Political Science, Geography, Economics'
  }
];

// ============================================================================
// 4. CLASSES 1 THROUGH 12
// ============================================================================
const DEFAULT_CLASSES = [
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
  { className: '11', displayName: 'Class 11th (Higher Secondary Streams)', numericLevel: 11, classMode: CLASS_MODES.MP_STREAM_ACADEMIC, hasStreams: true, order: 11 },
  { className: '12', displayName: 'Class 12th (MP Higher Secondary Board)', numericLevel: 12, classMode: CLASS_MODES.MP_STREAM_ACADEMIC, hasStreams: true, isExternalBoard: true, order: 12 }
];

// ============================================================================
// 5. MP BOARD GRADE & PASSING RULES
// ============================================================================
const DEFAULT_GRADE_RULES = [
  {
    ruleName: 'MP Board Standard 8-Point Grading Scale',
    ruleCode: 'MP_8_POINT',
    scaleType: '8_POINT',
    isDefault: true,
    isActive: true,
    boundaries: [
      { grade: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 10, description: 'Outstanding (सर्वोत्कृष्ट)' },
      { grade: 'A', minPercentage: 80, maxPercentage: 89.99, gradePoint: 9, description: 'Excellent (अति उत्तम)' },
      { grade: 'B+', minPercentage: 70, maxPercentage: 79.99, gradePoint: 8, description: 'Very Good (बहुत अच्छा)' },
      { grade: 'B', minPercentage: 60, maxPercentage: 69.99, gradePoint: 7, description: 'Good (अच्छा)' },
      { grade: 'C+', minPercentage: 50, maxPercentage: 59.99, gradePoint: 6, description: 'Above Average (औसत से ऊपर)' },
      { grade: 'C', minPercentage: 40, maxPercentage: 49.99, gradePoint: 5, description: 'Average (औसत)' },
      { grade: 'D', minPercentage: 33, maxPercentage: 39.99, gradePoint: 4, description: 'Pass (उत्तीर्ण)' },
      { grade: 'E', minPercentage: 0, maxPercentage: 32.99, gradePoint: 0, description: 'Needs Improvement / Fail (अनुत्तीर्ण)' }
    ]
  },
  {
    ruleName: 'MP Primary School 5-Point Grading Scale (Classes 1-5)',
    ruleCode: 'MP_PRIMARY_5_POINT',
    scaleType: '5_POINT',
    isDefault: false,
    isActive: true,
    boundaries: [
      { grade: 'A', minPercentage: 85, maxPercentage: 100, gradePoint: 5, description: 'Excellent (उत्कृष्ट)' },
      { grade: 'B', minPercentage: 70, maxPercentage: 84.99, gradePoint: 4, description: 'Very Good (बहुत अच्छा)' },
      { grade: 'C', minPercentage: 50, maxPercentage: 69.99, gradePoint: 3, description: 'Good (अच्छा)' },
      { grade: 'D', minPercentage: 33, maxPercentage: 49.99, gradePoint: 2, description: 'Satisfactory / Pass (संतोषजनक)' },
      { grade: 'E', minPercentage: 0, maxPercentage: 32.99, gradePoint: 1, description: 'Needs Special Attention (विशेष ध्यान अपेक्षित)' }
    ]
  },
  {
    ruleName: 'MP Secondary Traditional Division Scale',
    ruleCode: 'MP_DIVISION_SYSTEM',
    scaleType: 'DIVISION_SYSTEM',
    isDefault: false,
    isActive: true,
    boundaries: [
      { grade: 'First Division with Distinction', minPercentage: 75, maxPercentage: 100, gradePoint: 10, description: 'First Class with Distinction (विशेष योग्यता)' },
      { grade: 'First Division', minPercentage: 60, maxPercentage: 74.99, gradePoint: 8, description: 'First Class (प्रथम श्रेणी)' },
      { grade: 'Second Division', minPercentage: 45, maxPercentage: 59.99, gradePoint: 6, description: 'Second Class (द्वितीय श्रेणी)' },
      { grade: 'Third Division', minPercentage: 33, maxPercentage: 44.99, gradePoint: 4, description: 'Third Class (तृतीय श्रेणी)' },
      { grade: 'Fail', minPercentage: 0, maxPercentage: 32.99, gradePoint: 0, description: 'Failed (अनुत्तीर्ण)' }
    ]
  }
];

const DEFAULT_PASSING_RULES = [
  {
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
    },
    description: 'Official MPBSE criteria: 33% overall and 33% individually in Theory and Practical. Up to 5 grace marks per subject.',
    isActive: true
  },
  {
    ruleName: 'MP Primary & Middle School Passing Rule (33% Aggregate CCE)',
    ruleCode: 'PRIMARY_PASS_33',
    overallMinPercentage: 33,
    subjectMinPercentage: 33,
    requireComponentPassing: false,
    componentRules: [
      { componentCode: 'TH', minPercentage: 33, isRequiredToPass: false },
      { componentCode: 'IA', minPercentage: 33, isRequiredToPass: false }
    ],
    graceMarksPolicy: {
      allowGraceMarks: true,
      maxGraceMarksPerSubject: 5,
      maxGraceMarksTotal: 10
    },
    supplementaryRules: {
      allowSupplementary: true,
      maxFailedSubjects: 2
    },
    description: 'Continuous Comprehensive Evaluation (CCE) pattern for Classes 1 to 8 without mandatory separate component barrier.',
    isActive: true
  }
];

// ============================================================================
// 6. MP BOARD CURRICULUM SUBJECTS CATALOG (Classes 1 - 12)
// ============================================================================
const CLASS_WISE_SUBJECT_CATALOG = [
  // Primary (Classes 1, 2)
  {
    subjectName: 'Hindi (विशिष्ट / Special)',
    baseCode: 'HIN',
    applicableClasses: ['1', '2'],
    subjectType: 'COMPULSORY',
    displayOrder: 1,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Assessment & Activities', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'English (सामान्य / General)',
    baseCode: 'ENG',
    applicableClasses: ['1', '2'],
    subjectType: 'COMPULSORY',
    displayOrder: 2,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Assessment & Activities', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Mathematics (गणित)',
    baseCode: 'MATH',
    applicableClasses: ['1', '2'],
    subjectType: 'COMPULSORY',
    displayOrder: 3,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Maths Lab & Practical Activities', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Arts, Health & Physical Education (कला एवं शारीरिक शिक्षा)',
    baseCode: 'ART',
    applicableClasses: ['1', '2'],
    subjectType: 'COMPULSORY',
    displayOrder: 4,
    components: [
      { name: 'Activity Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 100, passingMarks: 33 }
    ]
  },

  // Primary (Classes 3, 4, 5)
  {
    subjectName: 'Hindi (विशिष्ट / Special)',
    baseCode: 'HIN',
    applicableClasses: ['3', '4', '5'],
    subjectType: 'COMPULSORY',
    displayOrder: 1,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Assessment & Project', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'English (सामान्य / General)',
    baseCode: 'ENG',
    applicableClasses: ['3', '4', '5'],
    subjectType: 'COMPULSORY',
    displayOrder: 2,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Assessment & Project', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Mathematics (गणित)',
    baseCode: 'MATH',
    applicableClasses: ['3', '4', '5'],
    subjectType: 'COMPULSORY',
    displayOrder: 3,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Maths Lab & Practical Activities', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Environmental Studies (पर्यावरण अध्ययन - EVS)',
    baseCode: 'EVS',
    applicableClasses: ['3', '4', '5'],
    subjectType: 'COMPULSORY',
    displayOrder: 4,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Project & Environmental Activities', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Arts, Work Experience & Physical Education',
    baseCode: 'ART',
    applicableClasses: ['3', '4', '5'],
    subjectType: 'COMPULSORY',
    displayOrder: 5,
    components: [
      { name: 'Activity Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 100, passingMarks: 33 }
    ]
  },

  // Middle School (Classes 6, 7, 8)
  {
    subjectName: 'First Language: Hindi (विशिष्ट हिन्दी)',
    baseCode: 'HIN',
    applicableClasses: ['6', '7', '8'],
    subjectType: 'COMPULSORY',
    displayOrder: 1,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Project & Internal Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Second Language: English (सामान्य अंग्रेजी)',
    baseCode: 'ENG',
    applicableClasses: ['6', '7', '8'],
    subjectType: 'COMPULSORY',
    displayOrder: 2,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Project & Internal Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Third Language: Sanskrit (तृतीय भाषा संस्कृत)',
    baseCode: 'SAN',
    applicableClasses: ['6', '7', '8'],
    subjectType: 'COMPULSORY',
    displayOrder: 3,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Project & Internal Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Mathematics (गणित)',
    baseCode: 'MATH',
    applicableClasses: ['6', '7', '8'],
    subjectType: 'COMPULSORY',
    displayOrder: 4,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Maths Lab & Practical Activities', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Science (विज्ञान)',
    baseCode: 'SCI',
    applicableClasses: ['6', '7', '8'],
    subjectType: 'COMPULSORY',
    displayOrder: 5,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Science Practical & Project', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Social Science (सामाजिक विज्ञान)',
    baseCode: 'SST',
    applicableClasses: ['6', '7', '8'],
    subjectType: 'COMPULSORY',
    displayOrder: 6,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Social Studies Project Work', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },

  // Secondary School (Classes 9, 10 - MPBSE High School)
  {
    subjectName: 'Hindi (Special / विशिष्ट हिन्दी)',
    baseCode: 'HIN',
    applicableClasses: ['9', '10'],
    subjectType: 'COMPULSORY',
    displayOrder: 1,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Assessment & Project', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'English (General / सामान्य अंग्रेजी)',
    baseCode: 'ENG',
    applicableClasses: ['9', '10'],
    subjectType: 'COMPULSORY',
    displayOrder: 2,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Assessment & Project', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Sanskrit (Third Language / तृतीय भाषा संस्कृत)',
    baseCode: 'SAN',
    applicableClasses: ['9', '10'],
    subjectType: 'COMPULSORY',
    displayOrder: 3,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Assessment & Project', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Mathematics (गणित)',
    baseCode: 'MATH',
    applicableClasses: ['9', '10'],
    subjectType: 'COMPULSORY',
    displayOrder: 4,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Maths Lab & Practical Activities', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Science (विज्ञान)',
    baseCode: 'SCI',
    applicableClasses: ['9', '10'],
    hasPractical: true,
    subjectType: 'COMPULSORY',
    displayOrder: 5,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Science Practical & Experiments', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Social Science (सामाजिक विज्ञान)',
    baseCode: 'SST',
    applicableClasses: ['9', '10'],
    subjectType: 'COMPULSORY',
    displayOrder: 6,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Project & Map Work', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },

  // Higher Secondary (Classes 11, 12) - Common Languages
  {
    subjectName: 'Hindi (Core / विशिष्ट हिन्दी)',
    baseCode: 'HIN',
    applicableClasses: ['11', '12'],
    subjectType: 'COMPULSORY',
    displayOrder: 1,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project & Viva', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 20, passingMarks: 7 }
    ]
  },
  {
    subjectName: 'English (Core / सामान्य अंग्रेजी)',
    baseCode: 'ENG',
    applicableClasses: ['11', '12'],
    subjectType: 'COMPULSORY',
    displayOrder: 2,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project & Listening/Speaking', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 20, passingMarks: 7 }
    ]
  },

  // Higher Secondary Science Stream
  {
    subjectName: 'Physics (भौतिक शास्त्र)',
    baseCode: 'PHY',
    streamName: 'Science',
    applicableClasses: ['11', '12'],
    hasPractical: true,
    subjectType: 'ELECTIVE',
    displayOrder: 3,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 70, passingMarks: 23 },
      { name: 'Practical Examination', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 30, passingMarks: 10 }
    ]
  },
  {
    subjectName: 'Chemistry (रसायन शास्त्र)',
    baseCode: 'CHEM',
    streamName: 'Science',
    applicableClasses: ['11', '12'],
    hasPractical: true,
    subjectType: 'ELECTIVE',
    displayOrder: 4,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 70, passingMarks: 23 },
      { name: 'Practical Examination', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 30, passingMarks: 10 }
    ]
  },
  {
    subjectName: 'Mathematics (उच्च गणित)',
    baseCode: 'HMATH',
    streamName: 'Science',
    applicableClasses: ['11', '12'],
    subjectType: 'ELECTIVE',
    displayOrder: 5,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Internal Assessment & Activities', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 20, passingMarks: 7 }
    ]
  },
  {
    subjectName: 'Biology (जीव विज्ञान)',
    baseCode: 'BIO',
    streamName: 'Science',
    applicableClasses: ['11', '12'],
    hasPractical: true,
    subjectType: 'ELECTIVE',
    displayOrder: 6,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 70, passingMarks: 23 },
      { name: 'Practical Examination', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 30, passingMarks: 10 }
    ]
  },
  {
    subjectName: 'Computer Science / IP (कंप्यूटर विज्ञान)',
    baseCode: 'CS',
    streamName: 'Science',
    applicableClasses: ['11', '12'],
    hasPractical: true,
    subjectType: 'ELECTIVE',
    displayOrder: 7,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 70, passingMarks: 23 },
      { name: 'Practical Examination & Project', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 30, passingMarks: 10 }
    ]
  },

  // Higher Secondary Commerce Stream
  {
    subjectName: 'Accountancy (बहीखाता एवं लेखाकर्म)',
    baseCode: 'ACC',
    streamName: 'Commerce',
    applicableClasses: ['11', '12'],
    subjectType: 'ELECTIVE',
    displayOrder: 8,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project Work & Viva', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 20, passingMarks: 7 }
    ]
  },
  {
    subjectName: 'Business Studies (व्यवसाय अध्ययन)',
    baseCode: 'BST',
    streamName: 'Commerce',
    applicableClasses: ['11', '12'],
    subjectType: 'ELECTIVE',
    displayOrder: 9,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project Work & Viva', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 20, passingMarks: 7 }
    ]
  },
  {
    subjectName: 'Economics (अर्थशास्त्र)',
    baseCode: 'ECO',
    streamName: 'Commerce',
    applicableClasses: ['11', '12'],
    subjectType: 'ELECTIVE',
    displayOrder: 10,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project Work & Viva', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 20, passingMarks: 7 }
    ]
  },

  // Higher Secondary Arts Stream
  {
    subjectName: 'History (इतिहास)',
    baseCode: 'HIST',
    streamName: 'Arts / Humanities',
    applicableClasses: ['11', '12'],
    subjectType: 'ELECTIVE',
    displayOrder: 11,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project Work & Viva', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 20, passingMarks: 7 }
    ]
  },
  {
    subjectName: 'Political Science (राजनीति विज्ञान)',
    baseCode: 'POL',
    streamName: 'Arts / Humanities',
    applicableClasses: ['11', '12'],
    subjectType: 'ELECTIVE',
    displayOrder: 12,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project Work & Viva', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 20, passingMarks: 7 }
    ]
  },
  {
    subjectName: 'Geography (भूगोल)',
    baseCode: 'GEO',
    streamName: 'Arts / Humanities',
    applicableClasses: ['11', '12'],
    hasPractical: true,
    subjectType: 'ELECTIVE',
    displayOrder: 13,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 70, passingMarks: 23 },
      { name: 'Practical & Map Work', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 30, passingMarks: 10 }
    ]
  }
];

// ============================================================================
// 7. STANDARD FEE HEADS
// ============================================================================
const DEFAULT_FEE_HEADS = [
  { name: 'Tuition Fee', code: 'TUTION', description: 'Academic tuition fee per term' },
  { name: 'Admission & Registration Fee', code: 'ADM', description: 'One-time admission charge' },
  { name: 'Examination & Lab Fee', code: 'EXAM', description: 'Term assessment & laboratory practical fee' },
  { name: 'Annual Development Fee', code: 'ANNUAL', description: 'School infrastructure and development charge' },
  { name: 'Computer & Smart Class Fee', code: 'COMP', description: 'IT, digital lab, and smart class charge' },
  { name: 'Sports & Cultural Fee', code: 'SPORTS', description: 'Athletics, sports kits, and cultural event charge' },
  { name: 'Library Fee', code: 'LIB', description: 'Library book access and digital resource charge' },
  { name: 'Transport / Bus Fee', code: 'TRANS', description: 'Optional school transportation bus charge', isOptional: true }
];

// ============================================================================
// 8. OFFICIAL GOVERNMENT MODEL EXCELLENCE SCHOOL SETTINGS
// ============================================================================
const DEFAULT_SETTINGS = {
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
};

// ============================================================================
// 9. CURATED DEMO STUDENTS COHORT (For Attendance, Marks & Showcase)
// ============================================================================
const DEMO_STUDENTS = [
  // Class 9th - Section A (Allocated to teacher Pooja Verma)
  {
    admissionNo: 'ADM-2025-0901',
    samagraId: '109283741',
    mpBseRollNo: '9012501',
    studentName: 'Aarav Sharma',
    fatherName: 'Dinesh Sharma',
    motherName: 'Sunita Sharma',
    gender: 'MALE',
    category: 'GEN',
    mobileNo: '9826111001',
    dob: new Date('2010-07-15'),
    currentSession: '2025-26',
    currentClass: '9',
    currentSection: 'A',
    currentRollNo: '1'
  },
  {
    admissionNo: 'ADM-2025-0902',
    samagraId: '109283742',
    mpBseRollNo: '9012502',
    studentName: 'Priya Patel',
    fatherName: 'Mahesh Patel',
    motherName: 'Rekha Patel',
    gender: 'FEMALE',
    category: 'OBC',
    mobileNo: '9826111002',
    dob: new Date('2010-09-22'),
    currentSession: '2025-26',
    currentClass: '9',
    currentSection: 'A',
    currentRollNo: '2'
  },
  {
    admissionNo: 'ADM-2025-0903',
    samagraId: '109283743',
    mpBseRollNo: '9012503',
    studentName: 'Rohit Verma',
    fatherName: 'Kailash Verma',
    motherName: 'Kavita Verma',
    gender: 'MALE',
    category: 'SC',
    mobileNo: '9826111003',
    dob: new Date('2010-03-10'),
    currentSession: '2025-26',
    currentClass: '9',
    currentSection: 'A',
    currentRollNo: '3'
  },
  {
    admissionNo: 'ADM-2025-0904',
    samagraId: '109283744',
    mpBseRollNo: '9012504',
    studentName: 'Ananya Chouhan',
    fatherName: 'Rajendra Chouhan',
    motherName: 'Meena Chouhan',
    gender: 'FEMALE',
    category: 'GEN',
    mobileNo: '9826111004',
    dob: new Date('2010-11-05'),
    currentSession: '2025-26',
    currentClass: '9',
    currentSection: 'A',
    currentRollNo: '4'
  },
  {
    admissionNo: 'ADM-2025-0905',
    samagraId: '109283745',
    mpBseRollNo: '9012505',
    studentName: 'Deepak Malviya',
    fatherName: 'Sanjay Malviya',
    motherName: 'Geeta Malviya',
    gender: 'MALE',
    category: 'OBC',
    mobileNo: '9826111005',
    dob: new Date('2010-06-18'),
    currentSession: '2025-26',
    currentClass: '9',
    currentSection: 'A',
    currentRollNo: '5'
  },

  // Class 1st - Section A (Primary Wing)
  {
    admissionNo: 'ADM-2025-0101',
    samagraId: '101283701',
    studentName: 'Vihaan Gupta',
    fatherName: 'Alok Gupta',
    motherName: 'Ritu Gupta',
    gender: 'MALE',
    category: 'GEN',
    mobileNo: '9826112001',
    dob: new Date('2019-04-12'),
    currentSession: '2025-26',
    currentClass: '1',
    currentSection: 'A',
    currentRollNo: '1'
  },
  {
    admissionNo: 'ADM-2025-0102',
    samagraId: '101283702',
    studentName: 'Aadhya Jain',
    fatherName: 'Praveen Jain',
    motherName: 'Neelam Jain',
    gender: 'FEMALE',
    category: 'GEN',
    mobileNo: '9826112002',
    dob: new Date('2019-08-25'),
    currentSession: '2025-26',
    currentClass: '1',
    currentSection: 'A',
    currentRollNo: '2'
  },
  {
    admissionNo: 'ADM-2025-0103',
    samagraId: '101283703',
    studentName: 'Kabir Singh',
    fatherName: 'Manmohan Singh',
    motherName: 'Jasmeet Kaur',
    gender: 'MALE',
    category: 'GEN',
    mobileNo: '9826112003',
    dob: new Date('2019-01-30'),
    currentSession: '2025-26',
    currentClass: '1',
    currentSection: 'A',
    currentRollNo: '3'
  }
];

// ============================================================================
// MASTER SEEDING FUNCTION
// ============================================================================
async function seedMasterData(options = {}) {
  const { verbose = false } = options;
  const log = verbose ? console.log : () => {};

  try {
    log('\n======================================================================');
    log('  MP SCHOOL ERP — CONSOLIDATED MASTER SEEDER (DEMO READY)');
    log('======================================================================');

    // ------------------------------------------------------------------------
    // Step 1: Seed Administrative & Staff System Users
    // ------------------------------------------------------------------------
    log('\n[1/11] Provisioning 1 Account Per Staff Role (Admin, Principal, Exam, Teacher, Accountant)...');
    const userMap = {};
    const staffMap = {};

    for (const u of DEFAULT_SYSTEM_USERS) {
      let userDoc = await User.findOne({ email: u.email });
      if (!userDoc) {
        userDoc = await User.create({
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
          phone: u.phone,
          designation: u.designation,
          assignedClasses: u.assignedClasses || []
        });
        log(`  ✓ Created user: [${u.role}] ${u.name} (${u.email})`);
      } else {
        // Reset password and profile to ensure demo credentials always work
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(u.password, salt);
        await User.updateOne(
          { _id: userDoc._id },
          {
            $set: {
              name: u.name,
              password: hashedPassword,
              role: u.role,
              phone: u.phone,
              designation: u.designation,
              assignedClasses: u.assignedClasses || [],
              isActive: true
            }
          }
        );
        log(`  ✓ Verified user: [${u.role}] ${u.name} (${u.email})`);
      }
      userMap[u.role] = userDoc;

      // Ensure corresponding Staff record is linked to this user
      let staffDoc = await Staff.findOne({
        $or: [{ userId: userDoc._id }, { email: u.email }, { employeeId: u.employeeId }]
      });

      const staffPayload = {
        employeeId: u.employeeId,
        userId: userDoc._id,
        fullName: u.name,
        email: u.email,
        phone: u.phone,
        gender: u.gender || 'MALE',
        designation: u.designation,
        cadre: u.cadre || 'TGT',
        department: u.department || 'ACADEMIC',
        qualification: u.qualification || 'Post Graduate, B.Ed',
        experienceYears: u.experienceYears || 5,
        salary: u.salary || 35000,
        isActive: true
      };

      if (!staffDoc) {
        staffDoc = await Staff.create(staffPayload);
        log(`  ✓ Created staff profile: ${staffDoc.fullName} [${staffDoc.employeeId}]`);
      } else {
        await Staff.updateOne({ _id: staffDoc._id }, { $set: staffPayload });
        log(`  ✓ Linked staff profile: ${staffDoc.fullName} [${staffDoc.employeeId}]`);
      }
      staffMap[u.role] = staffDoc;
    }

    const adminUser = userMap[ROLES.ADMIN];
    const teacherStaff = staffMap[ROLES.TEACHER];

    // ------------------------------------------------------------------------
    // Step 2: Seed Academic Sessions
    // ------------------------------------------------------------------------
    log('\n[2/11] Provisioning Academic Sessions (2025-26 Active)...');
    for (const session of DEFAULT_ACADEMIC_SESSIONS) {
      await AcademicSession.findOneAndUpdate(
        { sessionName: session.sessionName },
        { $set: { ...session, createdBy: adminUser?._id } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      log(`  ✓ Session: ${session.sessionName} (${session.isCurrent ? 'Current Active' : 'Other'})`);
    }

    // ------------------------------------------------------------------------
    // Step 3: Seed Higher Secondary Streams
    // ------------------------------------------------------------------------
    log('\n[3/11] Provisioning Higher Secondary Streams (Science, Commerce, Arts)...');
    const streamMap = {};
    for (const stream of DEFAULT_STREAMS) {
      const doc = await Stream.findOneAndUpdate(
        { streamCode: stream.streamCode },
        { $set: stream },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      streamMap[stream.streamName.toLowerCase()] = doc;
      streamMap[stream.streamCode.toLowerCase()] = doc;
      log(`  ✓ Stream: ${stream.streamName} [${stream.streamCode}]`);
    }

    // ------------------------------------------------------------------------
    // Step 4: Seed Classes 1 to 12 & Sections A & B
    // ------------------------------------------------------------------------
    log('\n[4/11] Provisioning Classes 1 through 12 and Standard Sections (A & B)...');
    const classMap = {};
    for (const cls of DEFAULT_CLASSES) {
      const classDoc = await Class.findOneAndUpdate(
        { className: cls.className },
        { $set: cls },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      classMap[cls.className] = classDoc;

      // Section A
      await Section.findOneAndUpdate(
        { className: cls.className, sectionName: 'A' },
        {
          $set: {
            classId: classDoc._id,
            className: cls.className,
            sectionName: 'A',
            roomNumber: `Room-${100 + Number(cls.numericLevel)}`,
            classTeacher: cls.className === '9' ? teacherStaff?._id : undefined,
            classTeacherName: cls.className === '9' ? teacherStaff?.fullName : 'Class Teacher',
            isActive: true
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Section B
      await Section.findOneAndUpdate(
        { className: cls.className, sectionName: 'B' },
        {
          $set: {
            classId: classDoc._id,
            className: cls.className,
            sectionName: 'B',
            roomNumber: `Room-${200 + Number(cls.numericLevel)}`,
            isActive: true
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      log(`  ✓ Class ${cls.className}: ${cls.displayName} + Sec A & B`);
    }

    // ------------------------------------------------------------------------
    // Step 5: Seed MP Board Grade & Passing Rules
    // ------------------------------------------------------------------------
    log('\n[5/11] Provisioning MP Board Grade Rules & Passing Rules...');
    const ruleMap = { grade: {}, passing: {} };

    for (const gr of DEFAULT_GRADE_RULES) {
      const doc = await GradeRule.findOneAndUpdate(
        { ruleCode: gr.ruleCode },
        { $set: gr },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      ruleMap.grade[gr.ruleCode] = doc._id;
      log(`  ✓ Grade Rule: ${gr.ruleName} [${gr.ruleCode}]`);
    }

    for (const pr of DEFAULT_PASSING_RULES) {
      const doc = await PassingRule.findOneAndUpdate(
        { ruleCode: pr.ruleCode },
        { $set: pr },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      ruleMap.passing[pr.ruleCode] = doc._id;
      log(`  ✓ Passing Rule: ${pr.ruleName} [${pr.ruleCode}]`);
    }

    // ------------------------------------------------------------------------
    // Step 6: Seed Official MP Board Examination Schemes
    // ------------------------------------------------------------------------
    log('\n[6/11] Provisioning Examination Evaluation Schemes...');
    const SCHEME_DEFINITIONS = [
      {
        schemeName: 'MP Primary School Evaluation Scheme (Classes 1-4)',
        schemeCode: 'MP_PRI_ANNUAL',
        applicableClasses: ['1', '2', '3', '4'],
        examType: EXAMINATION_TYPES.SUMMATIVE,
        components: [
          { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 75, passingMarks: 25, required: true, order: 1 },
          { name: 'Internal Assessment & Activities', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, defaultMaxMarks: 25, passingMarks: 8, required: true, order: 2 }
        ],
        totalMaxMarks: 100,
        passingRuleId: ruleMap.passing['PRIMARY_PASS_33'],
        gradeRuleId: ruleMap.grade['MP_PRIMARY_5_POINT'] || ruleMap.grade['MP_8_POINT'],
        allowSubjectComponentOverride: true,
        calculationMethod: 'SUM_COMPONENTS',
        description: 'Standard continuous evaluation scheme for MP primary schools (Classes 1-4).'
      },
      {
        schemeName: 'MP Board Class 5th Board Examination Scheme',
        schemeCode: 'MP_BOARD_05',
        applicableClasses: ['5'],
        examType: EXAMINATION_TYPES.SUMMATIVE,
        components: [
          { name: 'Board Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 75, passingMarks: 25, required: true, order: 1 },
          { name: 'Internal Assessment & Project', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, defaultMaxMarks: 25, passingMarks: 8, required: true, order: 2 }
        ],
        totalMaxMarks: 100,
        passingRuleId: ruleMap.passing['PRIMARY_PASS_33'],
        gradeRuleId: ruleMap.grade['MP_PRIMARY_5_POINT'] || ruleMap.grade['MP_8_POINT'],
        allowSubjectComponentOverride: true,
        calculationMethod: 'SUM_COMPONENTS',
        description: 'State board external examination scheme for Class 5th.'
      },
      {
        schemeName: 'MP Middle School Evaluation Scheme (Classes 6-7)',
        schemeCode: 'MP_MID_ANNUAL',
        applicableClasses: ['6', '7'],
        examType: EXAMINATION_TYPES.SUMMATIVE,
        components: [
          { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 75, passingMarks: 25, required: true, order: 1 },
          { name: 'Internal Assessment & Project Work', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, defaultMaxMarks: 25, passingMarks: 8, required: true, order: 2 }
        ],
        totalMaxMarks: 100,
        passingRuleId: ruleMap.passing['PRIMARY_PASS_33'],
        gradeRuleId: ruleMap.grade['MP_8_POINT'],
        allowSubjectComponentOverride: true,
        calculationMethod: 'SUM_COMPONENTS',
        description: 'MP Board middle school grading and assessment scheme (Classes 6 & 7).'
      },
      {
        schemeName: 'MP Board Class 8th Board Examination Scheme',
        schemeCode: 'MP_BOARD_08',
        applicableClasses: ['8'],
        examType: EXAMINATION_TYPES.SUMMATIVE,
        components: [
          { name: 'Board Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 75, passingMarks: 25, required: true, order: 1 },
          { name: 'Internal Assessment & Project', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, defaultMaxMarks: 25, passingMarks: 8, required: true, order: 2 }
        ],
        totalMaxMarks: 100,
        passingRuleId: ruleMap.passing['MP_PASS_33'],
        gradeRuleId: ruleMap.grade['MP_8_POINT'],
        allowSubjectComponentOverride: true,
        calculationMethod: 'SUM_COMPONENTS',
        description: 'State board external examination scheme for Class 8th.'
      },
      {
        schemeName: 'MP High School Class 9th Annual Scheme',
        schemeCode: 'MP_HIGH_09_ANNUAL',
        applicableClasses: ['9'],
        examType: EXAMINATION_TYPES.SUMMATIVE,
        components: [
          { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 75, passingMarks: 25, required: true, order: 1 },
          { name: 'Practical Examination', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, defaultMaxMarks: 25, passingMarks: 8, required: false, order: 2 },
          { name: 'Internal Assessment / Project', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, defaultMaxMarks: 25, passingMarks: 8, required: false, order: 3 }
        ],
        totalMaxMarks: 100,
        passingRuleId: ruleMap.passing['MP_PASS_33'],
        gradeRuleId: ruleMap.grade['MP_8_POINT'],
        allowSubjectComponentOverride: true,
        calculationMethod: 'SUM_COMPONENTS',
        description: 'MP High School Class 9 curriculum scheme (Theory 75 + Practical/Project 25).'
      },
      {
        schemeName: 'MPBSE High School Class 10th Board Scheme',
        schemeCode: 'MPBSE_BOARD_10',
        applicableClasses: ['10'],
        examType: EXAMINATION_TYPES.SUMMATIVE,
        components: [
          { name: 'Board Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 75, passingMarks: 25, required: true, order: 1 },
          { name: 'Practical Examination', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, defaultMaxMarks: 25, passingMarks: 8, required: false, order: 2 },
          { name: 'Internal Assessment / Project', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, defaultMaxMarks: 25, passingMarks: 8, required: false, order: 3 }
        ],
        totalMaxMarks: 100,
        passingRuleId: ruleMap.passing['MP_PASS_33'],
        gradeRuleId: ruleMap.grade['MP_8_POINT'],
        allowSubjectComponentOverride: true,
        calculationMethod: 'SUM_COMPONENTS',
        description: 'MP Board Class 10 High School Board Examination criteria.'
      },
      {
        schemeName: 'MP Higher Secondary Class 11th Annual Scheme',
        schemeCode: 'MP_HSS_11_ANNUAL',
        applicableClasses: ['11'],
        examType: EXAMINATION_TYPES.SUMMATIVE,
        components: [
          { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 70, passingMarks: 23, required: true, order: 1 },
          { name: 'Practical / Project Work', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, defaultMaxMarks: 30, passingMarks: 10, required: false, order: 2 },
          { name: 'Internal Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, defaultMaxMarks: 20, passingMarks: 7, required: false, order: 3 }
        ],
        totalMaxMarks: 100,
        passingRuleId: ruleMap.passing['MP_PASS_33'],
        gradeRuleId: ruleMap.grade['MP_8_POINT'],
        allowSubjectComponentOverride: true,
        calculationMethod: 'SUM_COMPONENTS',
        description: 'MP Higher Secondary Class 11 Stream-wise scheme.'
      },
      {
        schemeName: 'MPBSE Higher Secondary Class 12th Board Scheme',
        schemeCode: 'MPBSE_BOARD_12',
        applicableClasses: ['12'],
        examType: EXAMINATION_TYPES.SUMMATIVE,
        components: [
          { name: 'Board Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 70, passingMarks: 23, required: true, order: 1 },
          { name: 'Board Practical / Project', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, defaultMaxMarks: 30, passingMarks: 10, required: false, order: 2 },
          { name: 'Internal Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, defaultMaxMarks: 20, passingMarks: 7, required: false, order: 3 }
        ],
        totalMaxMarks: 100,
        passingRuleId: ruleMap.passing['MP_PASS_33'],
        gradeRuleId: ruleMap.grade['MP_8_POINT'],
        allowSubjectComponentOverride: true,
        calculationMethod: 'SUM_COMPONENTS',
        description: 'MP Board Class 12 Higher Secondary Board Examination criteria.'
      }
    ];

    for (const sch of SCHEME_DEFINITIONS) {
      await ExaminationScheme.findOneAndUpdate(
        { schemeCode: sch.schemeCode },
        { $set: { ...sch, isActive: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      log(`  ✓ Examination Scheme: ${sch.schemeName} [${sch.schemeCode}]`);
    }

    // ------------------------------------------------------------------------
    // Step 7: Seed Official MP Board Curriculum Subjects (Exact Class Isolation)
    // ------------------------------------------------------------------------
    log('\n[7/11] Provisioning Official MP Board Subjects per Class (1 to 12)...');
    let totalSubjectsCreated = 0;

    for (const item of CLASS_WISE_SUBJECT_CATALOG) {
      for (const cls of item.applicableClasses) {
        const clsSuffix = String(cls).padStart(2, '0');
        const classSpecificCode = `${item.baseCode}_${clsSuffix}`;

        const payload = {
          subjectName: item.subjectName,
          subjectCode: classSpecificCode,
          applicableClasses: [cls],
          subjectType: item.subjectType || 'COMPULSORY',
          hasTheory: true,
          hasPractical: !!item.hasPractical,
          totalMaxMarks: 100,
          totalPassingMarks: 33,
          displayOrder: item.displayOrder || 0,
          components: item.components,
          isActive: true
        };

        if (item.streamName && streamMap[item.streamName.toLowerCase()]) {
          payload.streamId = streamMap[item.streamName.toLowerCase()]._id;
          payload.streamName = item.streamName;
        }

        await Subject.findOneAndUpdate(
          { subjectCode: classSpecificCode },
          { $set: payload },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        totalSubjectsCreated++;
      }
    }
    log(`  ✓ Created & verified ${totalSubjectsCreated} class-specific MP Board curriculum subjects across Classes 1-12.`);

    // ------------------------------------------------------------------------
    // Step 8: Seed Subject Combinations for Classes 11 & 12
    // ------------------------------------------------------------------------
    log('\n[8/11] Provisioning Subject Combinations for Higher Secondary Streams...');
    const sciStream = streamMap['science'] || streamMap['sci'];
    const commStream = streamMap['commerce'] || streamMap['comm'];
    const artsStream = streamMap['arts / humanities'] || streamMap['arts'];

    const findSubIds = async (cls, codes) => {
      const subs = await Subject.find({
        applicableClasses: cls,
        subjectCode: { $in: codes }
      });
      return subs.map((s) => s._id);
    };

    for (const cls of ['11', '12']) {
      const clsPfx = String(cls).padStart(2, '0');

      // Science (PCM)
      if (sciStream) {
        const pcmSubs = await findSubIds(cls, [`HIN_${clsPfx}`, `ENG_${clsPfx}`, `PHY_${clsPfx}`, `CHEM_${clsPfx}`, `HMATH_${clsPfx}`]);
        if (pcmSubs.length > 0) {
          await SubjectCombination.findOneAndUpdate(
            { className: cls, combinationCode: `CLS${cls}_SCI_PCM` },
            {
              $set: {
                combinationName: `Class ${cls} Science (PCM)`,
                combinationCode: `CLS${cls}_SCI_PCM`,
                className: cls,
                streamId: sciStream._id,
                streamName: 'Science',
                compulsorySubjects: pcmSubs,
                description: `MP Board Class ${cls} Higher Secondary Science (Physics, Chemistry, Mathematics)`
              }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          log(`  ✓ Combination: Class ${cls} Science (PCM)`);
        }

        // Science (PCB)
        const pcbSubs = await findSubIds(cls, [`HIN_${clsPfx}`, `ENG_${clsPfx}`, `PHY_${clsPfx}`, `CHEM_${clsPfx}`, `BIO_${clsPfx}`]);
        if (pcbSubs.length > 0) {
          await SubjectCombination.findOneAndUpdate(
            { className: cls, combinationCode: `CLS${cls}_SCI_PCB` },
            {
              $set: {
                combinationName: `Class ${cls} Science (PCB)`,
                combinationCode: `CLS${cls}_SCI_PCB`,
                className: cls,
                streamId: sciStream._id,
                streamName: 'Science',
                compulsorySubjects: pcbSubs,
                description: `MP Board Class ${cls} Higher Secondary Science (Physics, Chemistry, Biology)`
              }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          log(`  ✓ Combination: Class ${cls} Science (PCB)`);
        }
      }

      // Commerce
      if (commStream) {
        const commSubs = await findSubIds(cls, [`HIN_${clsPfx}`, `ENG_${clsPfx}`, `ACC_${clsPfx}`, `BST_${clsPfx}`, `ECO_${clsPfx}`]);
        if (commSubs.length > 0) {
          await SubjectCombination.findOneAndUpdate(
            { className: cls, combinationCode: `CLS${cls}_COMM` },
            {
              $set: {
                combinationName: `Class ${cls} Commerce`,
                combinationCode: `CLS${cls}_COMM`,
                className: cls,
                streamId: commStream._id,
                streamName: 'Commerce',
                compulsorySubjects: commSubs,
                description: `MP Board Class ${cls} Higher Secondary Commerce (Accountancy, Business Studies, Economics)`
              }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          log(`  ✓ Combination: Class ${cls} Commerce`);
        }
      }

      // Arts
      if (artsStream) {
        const artsSubs = await findSubIds(cls, [`HIN_${clsPfx}`, `ENG_${clsPfx}`, `HIST_${clsPfx}`, `POL_${clsPfx}`, `GEO_${clsPfx}`]);
        if (artsSubs.length > 0) {
          await SubjectCombination.findOneAndUpdate(
            { className: cls, combinationCode: `CLS${cls}_ARTS` },
            {
              $set: {
                combinationName: `Class ${cls} Arts / Humanities`,
                combinationCode: `CLS${cls}_ARTS`,
                className: cls,
                streamId: artsStream._id,
                streamName: 'Arts / Humanities',
                compulsorySubjects: artsSubs,
                description: `MP Board Class ${cls} Higher Secondary Arts (History, Political Science, Geography)`
              }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          log(`  ✓ Combination: Class ${cls} Arts / Humanities`);
        }
      }
    }

    // ------------------------------------------------------------------------
    // Step 9: Seed Standard Fee Heads & School Configuration
    // ------------------------------------------------------------------------
    log('\n[9/11] Provisioning Fee Heads & Government School Configuration...');
    for (const head of DEFAULT_FEE_HEADS) {
      await FeeHead.findOneAndUpdate(
        { code: head.code },
        { $set: head },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    log(`  ✓ Seeded ${DEFAULT_FEE_HEADS.length} standard fee heads.`);

    await Settings.findOneAndUpdate(
      { affiliationCode: DEFAULT_SETTINGS.affiliationCode },
      { $set: { ...DEFAULT_SETTINGS, updatedBy: adminUser?._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    log(`  ✓ School Settings: ${DEFAULT_SETTINGS.schoolName}`);

    // ------------------------------------------------------------------------
    // Step 10: Seed Teacher Allocations (Ready Demo Flow)
    // ------------------------------------------------------------------------
    log('\n[10/11] Provisioning Teacher Allocations for Live Demo Flow...');
    if (teacherStaff) {
      // 1. Allocate as Class Teacher of Class 9-A with Mathematics
      await TeacherAllocation.findOneAndUpdate(
        { academicSession: '2025-26', className: '9', sectionName: 'A', subjectCode: 'MATH_09' },
        {
          $set: {
            academicSession: '2025-26',
            teacher: teacherStaff._id,
            teacherName: teacherStaff.fullName,
            className: '9',
            sectionName: 'A',
            subjectCode: 'MATH_09',
            subjectName: 'Mathematics (गणित)',
            isClassTeacher: true
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      log(`  ✓ Allocated Pooja Verma: Class 9-A • Subject: Mathematics (गणित) [Class Teacher]`);

      // 2. Allocate as Subject Teacher of Class 10-A with Mathematics
      await TeacherAllocation.findOneAndUpdate(
        { academicSession: '2025-26', className: '10', sectionName: 'A', subjectCode: 'MATH_10' },
        {
          $set: {
            academicSession: '2025-26',
            teacher: teacherStaff._id,
            teacherName: teacherStaff.fullName,
            className: '10',
            sectionName: 'A',
            subjectCode: 'MATH_10',
            subjectName: 'Mathematics (गणित)',
            isClassTeacher: false
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      log(`  ✓ Allocated Pooja Verma: Class 10-A • Subject: Mathematics (गणित) [Subject Teacher]`);
    }

    // ------------------------------------------------------------------------
    // Step 11: Seed Curated Demo Students Cohort
    // ------------------------------------------------------------------------
    log('\n[11/11] Provisioning Curated Demo Students for Class 9-A & Class 1-A...');
    for (const s of DEMO_STUDENTS) {
      const studentDoc = await Student.findOneAndUpdate(
        { admissionNo: s.admissionNo },
        { $set: { ...s, isActive: true, createdBy: adminUser?._id } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Create Active Enrollment
      await StudentEnrollment.findOneAndUpdate(
        { studentId: studentDoc._id, sessionName: s.currentSession },
        {
          $set: {
            studentId: studentDoc._id,
            admissionNo: s.admissionNo,
            sessionName: s.currentSession,
            className: s.currentClass,
            sectionName: s.currentSection,
            rollNo: s.currentRollNo,
            isActive: true
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      log(`  ✓ Student: Roll ${s.currentRollNo} • ${s.studentName} (Class ${s.currentClass}-${s.currentSection})`);
    }

    // ------------------------------------------------------------------------
    // Step 12: Seed Live Demo Examination, Marks & Processed Results (Instant WOW)
    // ------------------------------------------------------------------------
    log('\n[12/13] Provisioning Live Demo Examination, Marks & Processed Results for Class 9-A...');
    const scheme9 = await ExaminationScheme.findOne({ schemeCode: 'MP_HIGH_09_ANNUAL' });
    const examUser = userMap[ROLES.EXAM_INCHARGE] || adminUser;
    const principalUser = userMap[ROLES.PRINCIPAL] || adminUser;

    const demoExam = await Examination.findOneAndUpdate(
      { examCode: 'HY_2025_26', sessionName: '2025-26' },
      {
        $set: {
          examName: 'अर्धवार्षिक परीक्षा 2025-26 (Half Yearly Exam)',
          examCode: 'HY_2025_26',
          sessionName: '2025-26',
          examType: EXAMINATION_TYPES.SUMMATIVE,
          schemeId: scheme9?._id,
          applicableClasses: ['9', '10'],
          startDate: new Date('2025-10-15'),
          endDate: new Date('2025-10-25'),
          marksSubmissionDeadline: new Date('2025-10-30'),
          isMarksEntryLocked: true,
          isResultPublished: true,
          publishedDate: new Date('2025-11-01')
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    log(`  ✓ Examination Created: ${demoExam.examName} [${demoExam.examCode}]`);

    // Fetch Class 9 subjects
    const class9SubjectCodes = ['HIN_09', 'ENG_09', 'SAN_09', 'MATH_09', 'SCI_09', 'SST_09'];
    const class9Subjects = await Subject.find({ subjectCode: { $in: class9SubjectCodes } });
    const subMap = {};
    for (const sub of class9Subjects) {
      subMap[sub.subjectCode] = sub;
    }

    // Student specific score profiles (5 students)
    const STUDENT_SCORES = [
      {
        rollNo: '1',
        admissionNo: 'ADM-2025-0901',
        studentName: 'Aarav Sharma',
        scores: {
          HIN_09: { th: 68, ia: 24 }, // 92
          ENG_09: { th: 65, ia: 23 }, // 88
          SAN_09: { th: 70, ia: 25 }, // 95
          MATH_09: { th: 72, ia: 25 }, // 97
          SCI_09: { th: 67, pr: 24 },  // 91
          SST_09: { th: 66, ia: 23 }   // 89
        },
        grandTotal: 552,
        percentage: 92.0,
        grade: 'A+',
        division: 'First Division with Distinction',
        rank: 1
      },
      {
        rollNo: '2',
        admissionNo: 'ADM-2025-0902',
        studentName: 'Priya Patel',
        scores: {
          HIN_09: { th: 62, ia: 22 }, // 84
          ENG_09: { th: 64, ia: 23 }, // 87
          SAN_09: { th: 60, ia: 21 }, // 81
          MATH_09: { th: 65, ia: 24 }, // 89
          SCI_09: { th: 63, pr: 22 },  // 85
          SST_09: { th: 61, ia: 22 }   // 83
        },
        grandTotal: 509,
        percentage: 84.8,
        grade: 'A',
        division: 'First Division',
        rank: 2
      },
      {
        rollNo: '3',
        admissionNo: 'ADM-2025-0903',
        studentName: 'Rohit Verma',
        scores: {
          HIN_09: { th: 52, ia: 20 }, // 72
          ENG_09: { th: 48, ia: 19 }, // 67
          SAN_09: { th: 55, ia: 20 }, // 75
          MATH_09: { th: 58, ia: 21 }, // 79
          SCI_09: { th: 50, pr: 20 },  // 70
          SST_09: { th: 53, ia: 20 }   // 73
        },
        grandTotal: 436,
        percentage: 72.7,
        grade: 'B+',
        division: 'First Division',
        rank: 3
      },
      {
        rollNo: '4',
        admissionNo: 'ADM-2025-0904',
        studentName: 'Ananya Singh',
        scores: {
          HIN_09: { th: 45, ia: 18 }, // 63
          ENG_09: { th: 42, ia: 17 }, // 59
          SAN_09: { th: 44, ia: 18 }, // 62
          MATH_09: { th: 46, ia: 18 }, // 64
          SCI_09: { th: 40, pr: 18 },  // 58
          SST_09: { th: 43, ia: 18 }   // 61
        },
        grandTotal: 367,
        percentage: 61.2,
        grade: 'B',
        division: 'First Division',
        rank: 4
      },
      {
        rollNo: '5',
        admissionNo: 'ADM-2025-0905',
        studentName: 'Vikas Gond',
        scores: {
          HIN_09: { th: 38, ia: 16 }, // 54
          ENG_09: { th: 32, ia: 15 }, // 47
          SAN_09: { th: 35, ia: 16 }, // 51
          MATH_09: { th: 22, ia: 15, grace: 3 }, // 37 + 3 grace = 40 (Grace demo)
          SCI_09: { th: 34, pr: 16 },  // 50
          SST_09: { th: 36, ia: 16 }   // 52
        },
        grandTotal: 294,
        percentage: 49.0,
        grade: 'D',
        division: 'Second Division (Pass with Grace)',
        rank: 5,
        graceTotal: 3
      }
    ];

    for (const studentProfile of STUDENT_SCORES) {
      const studentDoc = await Student.findOne({ admissionNo: studentProfile.admissionNo });
      if (!studentDoc) continue;

      const subjectResultsList = [];

      for (const [sCode, marksObj] of Object.entries(studentProfile.scores)) {
        const subDoc = subMap[sCode];
        if (!subDoc) continue;

        const isScience = sCode === 'SCI_09';
        const secondCode = isScience ? 'PR' : 'IA';
        const secondName = isScience ? 'Practical Examination' : 'Internal Assessment';
        const secondMarks = marksObj.pr !== undefined ? marksObj.pr : marksObj.ia;
        const grace = marksObj.grace || 0;
        const obtainedTotal = marksObj.th + secondMarks + grace;
        const pct = (obtainedTotal / 100) * 100;
        let subGrade = 'B';
        if (pct >= 85) subGrade = 'A+';
        else if (pct >= 70) subGrade = 'A';
        else if (pct >= 50) subGrade = 'B';
        else if (pct >= 33) subGrade = 'C';
        else subGrade = 'D';

        const componentsArray = [
          {
            componentCode: 'TH',
            componentName: 'Theory Examination',
            maxMarks: 75,
            obtainedMarks: marksObj.th,
            attendanceStatus: 'PRESENT',
            isGraceGiven: grace > 0,
            graceMarks: grace
          },
          {
            componentCode: secondCode,
            componentName: secondName,
            maxMarks: 25,
            obtainedMarks: secondMarks,
            attendanceStatus: 'PRESENT',
            isGraceGiven: false,
            graceMarks: 0
          }
        ];

        // Seed individual Marks record
        await Marks.findOneAndUpdate(
          { studentId: studentDoc._id, examinationId: demoExam._id, subjectId: subDoc._id },
          {
            $set: {
              studentId: studentDoc._id,
              admissionNo: studentDoc.admissionNo,
              examinationId: demoExam._id,
              sessionName: '2025-26',
              className: '9',
              sectionName: 'A',
              subjectId: subDoc._id,
              subjectName: subDoc.subjectName,
              subjectCode: subDoc.subjectCode,
              components: componentsArray,
              totalMaxMarks: 100,
              totalObtainedMarks: obtainedTotal,
              percentage: pct,
              grade: subGrade,
              isPassed: true,
              status: 'PRESENT',
              isLocked: true,
              enteredBy: teacherStaff?.userId || adminUser?._id,
              verifiedBy: examUser?._id
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        subjectResultsList.push({
          subjectId: subDoc._id,
          subjectName: subDoc.subjectName,
          subjectCode: subDoc.subjectCode,
          subjectType: 'COMPULSORY',
          components: componentsArray,
          totalMaxMarks: 100,
          totalObtainedMarks: obtainedTotal,
          percentage: pct,
          grade: subGrade,
          gradePoint: pct >= 85 ? 10 : pct >= 70 ? 8 : pct >= 50 ? 6 : 4,
          isPassed: true,
          status: 'PASS'
        });
      }

      // Seed processed Result record
      const verificationCode = `MPRMS-202526-09-${studentProfile.admissionNo.replace('ADM-2025-', '')}`;
      await Result.findOneAndUpdate(
        { studentId: studentDoc._id, examinationId: demoExam._id },
        {
          $set: {
            studentId: studentDoc._id,
            admissionNo: studentDoc.admissionNo,
            rollNo: studentProfile.rollNo,
            examinationId: demoExam._id,
            sessionName: '2025-26',
            className: '9',
            sectionName: 'A',
            streamName: '',
            schemeId: scheme9?._id,
            schemeVersion: 1,
            gradeRuleId: ruleMap.grade['MP_8_POINT'],
            passingRuleId: ruleMap.passing['MP_PASS_33'],
            subjectResults: subjectResultsList,
            grandTotalMax: 600,
            grandTotalObtained: studentProfile.grandTotal,
            overallPercentage: studentProfile.percentage,
            overallGrade: studentProfile.grade,
            division: studentProfile.division,
            resultStatus: RESULT_STATUSES.PASS,
            failedSubjectCount: 0,
            failedSubjects: [],
            graceMarksGiven: studentProfile.graceTotal || 0,
            attendance: { totalWorkingDays: 120, attendedDays: 110, attendancePercentage: 91.6 },
            coScholastic: {
              workEducation: 'A',
              artEducation: 'A',
              healthAndPhysicalEducation: 'A',
              discipline: 'A',
              generalConduct: 'EXCELLENT'
            },
            teacherRemarks: 'Excellent academic progress and disciplined behavior.',
            approvalStage: APPROVAL_STAGES.PUBLISHED,
            verificationCode,
            isPublished: true,
            publishedAt: new Date('2025-11-01'),
            submittedBy: teacherStaff?.userId || adminUser?._id,
            verifiedBy: examUser?._id,
            approvedBy: principalUser?._id
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      log(`  ✓ Result & Marksheet Ready: Roll ${studentProfile.rollNo} • ${studentProfile.studentName} (${studentProfile.percentage}% - Grade ${studentProfile.grade})`);
    }

    // ------------------------------------------------------------------------
    // Step 13: Seed Class 9 Fee Structure, Ledgers & Demo Payment Receipts
    // ------------------------------------------------------------------------
    log('\n[13/13] Provisioning Class 9 Fee Structure, Student Ledgers & Paid Receipts...');
    const tuiHead = await FeeHead.findOne({ code: 'TUI' });
    const devHead = await FeeHead.findOne({ code: 'DEV' });
    const examHead = await FeeHead.findOne({ code: 'EXAM' });
    const actHead = await FeeHead.findOne({ code: 'ACT' });
    const accountantUser = userMap[ROLES.ACCOUNTANT] || adminUser;

    const class9FeeStructure = await FeeStructure.findOneAndUpdate(
      { academicSession: '2025-26', className: '9' },
      {
        $set: {
          academicSession: '2025-26',
          className: '9',
          title: 'Class 9 Standard Annual Fee 2025-26',
          annualTotal: 18000,
          installments: [
            {
              installmentName: 'Term 1 (April - Admission & Development)',
              dueDate: new Date('2025-04-30'),
              totalAmount: 6000,
              items: [
                { feeHead: tuiHead?._id || new mongoose.Types.ObjectId(), headName: 'Tuition Fee', amount: 4000 },
                { feeHead: devHead?._id || new mongoose.Types.ObjectId(), headName: 'Development Fee', amount: 2000 }
              ]
            },
            {
              installmentName: 'Term 2 (September - Mid-Term & Exam)',
              dueDate: new Date('2025-09-30'),
              totalAmount: 6000,
              items: [
                { feeHead: tuiHead?._id || new mongoose.Types.ObjectId(), headName: 'Tuition Fee', amount: 4500 },
                { feeHead: examHead?._id || new mongoose.Types.ObjectId(), headName: 'Examination Fee', amount: 1500 }
              ]
            },
            {
              installmentName: 'Term 3 (December - Annual & Activities)',
              dueDate: new Date('2025-12-31'),
              totalAmount: 6000,
              items: [
                { feeHead: tuiHead?._id || new mongoose.Types.ObjectId(), headName: 'Tuition Fee', amount: 4500 },
                { feeHead: actHead?._id || new mongoose.Types.ObjectId(), headName: 'Sports & Cultural Activity', amount: 1500 }
              ]
            }
          ]
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    log(`  ✓ Class 9 Fee Structure Configured: ₹18,000 Annual`);

    // Student Fee Ledgers & Payments
    const FEE_LEDGER_DATA = [
      {
        admissionNo: 'ADM-2025-0901',
        studentName: 'Aarav Sharma',
        paidAmount: 12000,
        balanceAmount: 6000,
        status: 'PARTIAL',
        receipts: [
          { receiptNo: 'REC-2025-001', amount: 6000, mode: 'UPI', date: new Date('2025-04-15') },
          { receiptNo: 'REC-2025-002', amount: 6000, mode: 'CASH', date: new Date('2025-09-10') }
        ]
      },
      {
        admissionNo: 'ADM-2025-0902',
        studentName: 'Priya Patel',
        paidAmount: 18000,
        balanceAmount: 0,
        status: 'PAID',
        receipts: [
          { receiptNo: 'REC-2025-003', amount: 18000, mode: 'BANK_TRANSFER', date: new Date('2025-04-10') }
        ]
      },
      {
        admissionNo: 'ADM-2025-0903',
        studentName: 'Rohit Verma',
        paidAmount: 6000,
        balanceAmount: 12000,
        status: 'PARTIAL',
        receipts: [
          { receiptNo: 'REC-2025-004', amount: 6000, mode: 'CASH', date: new Date('2025-04-20') }
        ]
      },
      {
        admissionNo: 'ADM-2025-0904',
        studentName: 'Ananya Singh',
        paidAmount: 0,
        balanceAmount: 18000,
        status: 'PENDING',
        receipts: []
      },
      {
        admissionNo: 'ADM-2025-0905',
        studentName: 'Vikas Gond',
        paidAmount: 6000,
        balanceAmount: 12000,
        status: 'PARTIAL',
        receipts: [
          { receiptNo: 'REC-2025-005', amount: 6000, mode: 'UPI', date: new Date('2025-04-25') }
        ]
      }
    ];

    for (const fItem of FEE_LEDGER_DATA) {
      const studentDoc = await Student.findOne({ admissionNo: fItem.admissionNo });
      if (!studentDoc) continue;

      await StudentFeeLedger.findOneAndUpdate(
        { student: studentDoc._id, academicSession: '2025-26' },
        {
          $set: {
            student: studentDoc._id,
            admissionNo: studentDoc.admissionNo,
            studentName: studentDoc.studentName,
            academicSession: '2025-26',
            className: '9',
            sectionName: 'A',
            totalFee: 18000,
            discountAmount: 0,
            netFee: 18000,
            paidAmount: fItem.paidAmount,
            balanceAmount: fItem.balanceAmount,
            status: fItem.status,
            lastPaymentDate: fItem.receipts.length > 0 ? fItem.receipts[fItem.receipts.length - 1].date : null
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      for (const rec of fItem.receipts) {
        await FeePayment.findOneAndUpdate(
          { receiptNo: rec.receiptNo },
          {
            $set: {
              receiptNo: rec.receiptNo,
              student: studentDoc._id,
              admissionNo: studentDoc.admissionNo,
              studentName: studentDoc.studentName,
              academicSession: '2025-26',
              className: '9',
              sectionName: 'A',
              amountPaid: rec.amount,
              paymentMode: rec.mode,
              paymentDate: rec.date,
              transactionRef: `TXN-${rec.receiptNo}`,
              items: [
                { headName: 'Tuition & Academic Fees', amount: rec.amount }
              ],
              remarks: 'Quarterly tuition installment payment received with thanks.',
              collectedBy: accountantUser?._id,
              collectedByName: accountantUser?.name || 'Rameshwar Patidar'
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      log(`  ✓ Fee Ledger: ${fItem.studentName} (Paid: ₹${fItem.paidAmount}, Bal: ₹${fItem.balanceAmount} [${fItem.status}])`);
    }

    log('\n======================================================================');
    log('  MP SCHOOL ERP MASTER DATA SEEDING COMPLETE & VERIFIED!');
    log('======================================================================');
    log('  DEMO CREDENTIALS READY FOR SCHOOL PRESENTATION:');
    log('  ──────────────────────────────────────────────────────────────────');
    log('  1. ADMIN:           admin@mpschool.edu.in       / admin123');
    log('     Name: Dr. Rajesh Sharma (IT Head & Administrator)');
    log('  ──────────────────────────────────────────────────────────────────');
    log('  2. PRINCIPAL:       principal@mpschool.edu.in   / principal123');
    log('     Name: Smt. Vandana Mishra (Head of School)');
    log('  ──────────────────────────────────────────────────────────────────');
    log('  3. EXAM IN-CHARGE:  exam@mpschool.edu.in        / exam123');
    log('     Name: Shri Anil Chouhan (Exam Controller)');
    log('  ──────────────────────────────────────────────────────────────────');
    log('  4. TEACHER:         teacher@mpschool.edu.in     / teacher123');
    log('     Name: Pooja Verma (Class Teacher Class 9-A • Mathematics)');
    log('  ──────────────────────────────────────────────────────────────────');
    log('  5. ACCOUNTANT:      accountant@mpschool.edu.in  / accountant123');
    log('     Name: Rameshwar Patidar (Fee & Finance Officer)');
    log('======================================================================\n');

    return {
      success: true,
      usersCount: DEFAULT_SYSTEM_USERS.length,
      classesCount: DEFAULT_CLASSES.length,
      schemesCount: SCHEME_DEFINITIONS.length,
      subjectsCount: totalSubjectsCreated,
      demoStudentsCount: DEMO_STUDENTS.length
    };
  } catch (err) {
    console.error('[MP-RMS Master Seeder Error]:', err.message);
    throw err;
  }
}

// ============================================================================
// AUTO-SEED ON EMPTY DATABASE (Zero Friction Deployment)
// ============================================================================
async function autoSeedMasterDataIfEmpty() {
  try {
    const [userCount, classCount, schemeCount, subjectCount] = await Promise.all([
      User.countDocuments(),
      Class.countDocuments(),
      ExaminationScheme.countDocuments(),
      Subject.countDocuments()
    ]);

    const isFreshOrIncomplete = userCount === 0 || classCount === 0 || schemeCount === 0 || subjectCount === 0;

    if (isFreshOrIncomplete) {
      console.log(`[MP-RMS Auto-Setup] Fresh/Incomplete database detected (Users: ${userCount}, Classes: ${classCount}, Schemes: ${schemeCount}, Subjects: ${subjectCount}).`);
      console.log('[MP-RMS Auto-Setup] Auto-provisioning complete master data...');
      await seedMasterData({ verbose: true });
    } else {
      console.log(`[MP-RMS Master Data] Verified intact: ${classCount} Classes, ${schemeCount} Schemes, ${subjectCount} Subjects, ${userCount} Users.`);
    }
  } catch (err) {
    console.error('[MP-RMS Auto-Setup Error]:', err.message);
  }
}

module.exports = {
  seedMasterData,
  autoSeedMasterDataIfEmpty,
  DEFAULT_SYSTEM_USERS,
  DEFAULT_ACADEMIC_SESSIONS,
  DEFAULT_CLASSES,
  DEFAULT_SETTINGS
};
