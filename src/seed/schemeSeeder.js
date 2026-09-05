const mongoose = require('mongoose');
const GradeRule = require('../models/GradeRule');
const PassingRule = require('../models/PassingRule');
const ExaminationScheme = require('../models/ExaminationScheme');
const { EXAMINATION_TYPES, COMPONENT_TYPES } = require('../constants/examinationTypes');

// 1. MP Board Grade Rules Catalog
const GRADE_RULES = [
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

// 2. MP Board Passing Rules Catalog
const PASSING_RULES = [
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

// 3. Complete MP Examination Schemes Catalog
const getSchemeDefinitions = (ruleMap) => [
  // 1. Primary Classes 1 - 4
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
    description: 'Annual Evaluation Pattern for MP Primary Classes 1 to 4 (75 Theory + 25 Internal Assessment/Activities)',
    isActive: true
  },

  // 2. Class 5 & 8 State Board / External Authority
  {
    schemeName: 'MP Board Classes 5th & 8th Board Pattern',
    schemeCode: 'MP_BOARD_EXT_5_8',
    applicableClasses: ['5', '8'],
    examType: EXAMINATION_TYPES.EXTERNAL_BOARD,
    components: [
      { name: 'Board Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 60, passingMarks: 20, required: true, order: 1 },
      { name: 'Project & Portfolio Assessment', code: 'PR', type: COMPONENT_TYPES.PROJECT, defaultMaxMarks: 40, passingMarks: 13, required: true, order: 2 }
    ],
    totalMaxMarks: 100,
    passingRuleId: ruleMap.passing['MP_PASS_33'],
    gradeRuleId: ruleMap.grade['MP_8_POINT'],
    allowSubjectComponentOverride: true,
    calculationMethod: 'SUM_COMPONENTS',
    description: 'MP Rajya Shiksha Kendra (RSK) Board Pattern for Classes 5 & 8 (60 Written + 40 Project/Internal)',
    isActive: true
  },

  // 3. Middle School Classes 6 - 7
  {
    schemeName: 'MP Middle School Annual Evaluation (Classes 6-7)',
    schemeCode: 'MP_MID_ANNUAL',
    applicableClasses: ['6', '7'],
    examType: EXAMINATION_TYPES.SUMMATIVE,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 75, passingMarks: 25, required: true, order: 1 },
      { name: 'Internal Assessment & Project', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, defaultMaxMarks: 25, passingMarks: 8, required: true, order: 2 }
    ],
    totalMaxMarks: 100,
    passingRuleId: ruleMap.passing['PRIMARY_PASS_33'],
    gradeRuleId: ruleMap.grade['MP_8_POINT'],
    allowSubjectComponentOverride: true,
    calculationMethod: 'SUM_COMPONENTS',
    description: 'Annual Summative Pattern for Middle School Classes 6 and 7 (75 Theory + 25 Internal)',
    isActive: true
  },

  // 4. Class 9 MP Academic Pattern
  {
    schemeName: 'MP Class 9 Annual Exam Pattern',
    schemeCode: 'MP_CLS9_ANNUAL',
    applicableClasses: ['9'],
    examType: EXAMINATION_TYPES.SUMMATIVE,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 75, passingMarks: 25, required: true, order: 1 },
      { name: 'Practical / Project Assessment', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, defaultMaxMarks: 25, passingMarks: 8, required: true, order: 2 }
    ],
    totalMaxMarks: 100,
    passingRuleId: ruleMap.passing['MP_PASS_33'],
    gradeRuleId: ruleMap.grade['MP_8_POINT'],
    allowSubjectComponentOverride: true,
    calculationMethod: 'SUM_COMPONENTS',
    description: 'Annual Evaluation Pattern for MP Board Class 9 (75 Theory + 25 Practical/Project)',
    isActive: true
  },

  // 5. Class 10 MP Board High School
  {
    schemeName: 'MP Board Class 10 High School Board Pattern',
    schemeCode: 'MP_CLS10_BOARD',
    applicableClasses: ['10'],
    examType: EXAMINATION_TYPES.EXTERNAL_BOARD,
    components: [
      { name: 'Board Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 75, passingMarks: 25, required: true, order: 1 },
      { name: 'Internal Assessment / Project', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, defaultMaxMarks: 25, passingMarks: 8, required: true, order: 2 }
    ],
    totalMaxMarks: 100,
    passingRuleId: ruleMap.passing['MP_PASS_33'],
    gradeRuleId: ruleMap.grade['MP_8_POINT'],
    allowSubjectComponentOverride: true,
    calculationMethod: 'SUM_COMPONENTS',
    description: 'Official MPBSE High School Board Examination Pattern for Class 10 (75 Theory + 25 Internal Assessment)',
    isActive: true
  },

  // 6. Class 11 Stream Academic Pattern (Legacy & Multi-stream compatible)
  {
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
    passingRuleId: ruleMap.passing['MP_PASS_33'],
    gradeRuleId: ruleMap.grade['MP_8_POINT'],
    allowSubjectComponentOverride: true,
    calculationMethod: 'SUM_COMPONENTS',
    description: 'Class 11 Pattern with Subject-Specific Overrides (70/30 for Practicals, 80/20 for Languages/Commerce)',
    isActive: true
  },

  // 7. Higher Secondary Science Stream (Classes 11 & 12)
  {
    schemeName: 'MP Higher Secondary Science Stream Pattern (Classes 11 & 12)',
    schemeCode: 'MP_HSS_SCI',
    applicableClasses: ['11', '12'],
    applicableStreams: ['SCIENCE'],
    examType: EXAMINATION_TYPES.SUMMATIVE,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 70, passingMarks: 23, required: true, order: 1 },
      { name: 'Practical Lab Examination', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, defaultMaxMarks: 30, passingMarks: 10, required: true, order: 2 }
    ],
    totalMaxMarks: 100,
    passingRuleId: ruleMap.passing['MP_PASS_33'],
    gradeRuleId: ruleMap.grade['MP_8_POINT'],
    allowSubjectComponentOverride: true,
    calculationMethod: 'SUM_COMPONENTS',
    description: 'MP Board Pattern for Higher Secondary Science Stream (70 Theory + 30 Practical for Physics/Chemistry/Biology)',
    isActive: true
  },

  // 8. Higher Secondary Commerce & Arts Streams (Classes 11 & 12)
  {
    schemeName: 'MP Higher Secondary Commerce & Arts Pattern (Classes 11 & 12)',
    schemeCode: 'MP_HSS_COMM_ARTS',
    applicableClasses: ['11', '12'],
    applicableStreams: ['COMMERCE', 'ARTS'],
    examType: EXAMINATION_TYPES.SUMMATIVE,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, defaultMaxMarks: 80, passingMarks: 26, required: true, order: 1 },
      { name: 'Project Assessment & Viva', code: 'PR', type: COMPONENT_TYPES.PROJECT, defaultMaxMarks: 20, passingMarks: 7, required: true, order: 2 }
    ],
    totalMaxMarks: 100,
    passingRuleId: ruleMap.passing['MP_PASS_33'],
    gradeRuleId: ruleMap.grade['MP_8_POINT'],
    allowSubjectComponentOverride: true,
    calculationMethod: 'SUM_COMPONENTS',
    description: 'MP Board Pattern for Higher Secondary Commerce & Arts (80 Theory + 20 Internal/Project Assessment)',
    isActive: true
  },

  // 9. Monthly / Formative Periodic Assessment (Classes 1 - 12)
  {
    schemeName: 'Monthly Evaluation & Periodic Unit Test Pattern',
    schemeCode: 'MP_PERIODIC_TEST',
    applicableClasses: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    examType: EXAMINATION_TYPES.FORMATIVE,
    components: [
      { name: 'Periodic Written Test', code: 'TH', type: COMPONENT_TYPES.PERIODIC_TEST, defaultMaxMarks: 20, passingMarks: 7, required: true, order: 1 },
      { name: 'Oral / Activity Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, defaultMaxMarks: 5, passingMarks: 2, required: true, order: 2 }
    ],
    totalMaxMarks: 25,
    passingRuleId: ruleMap.passing['MP_PASS_33'],
    gradeRuleId: ruleMap.grade['MP_8_POINT'],
    allowSubjectComponentOverride: true,
    calculationMethod: 'SUM_COMPONENTS',
    description: 'Continuous Monthly / Formative Periodic Test Evaluation Pattern across all classes',
    isActive: true
  }
];

/**
 * Seeds or updates all MP Board Grade Rules, Passing Rules, and Examination Schemes.
 * Fully idempotent using findOneAndUpdate with upsert: true.
 */
async function seedAllSchemes(options = {}) {
  const { verbose = false } = options;
  const log = verbose ? console.log : () => {};

  try {
    log('[MP-RMS Schemes] Seeding Grade Rules...');
    const gradeRuleMap = {};
    for (const rule of GRADE_RULES) {
      const doc = await GradeRule.findOneAndUpdate(
        { ruleCode: rule.ruleCode },
        { $set: rule },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      gradeRuleMap[rule.ruleCode] = doc._id;
      log(`  ✓ Grade Rule: ${rule.ruleName} [${rule.ruleCode}]`);
    }

    log('[MP-RMS Schemes] Seeding Passing Rules...');
    const passingRuleMap = {};
    for (const rule of PASSING_RULES) {
      const doc = await PassingRule.findOneAndUpdate(
        { ruleCode: rule.ruleCode },
        { $set: rule },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      passingRuleMap[rule.ruleCode] = doc._id;
      log(`  ✓ Passing Rule: ${rule.ruleName} [${rule.ruleCode}]`);
    }

    log('[MP-RMS Schemes] Seeding Examination Schemes...');
    const schemes = getSchemeDefinitions({ grade: gradeRuleMap, passing: passingRuleMap });
    const createdSchemes = [];

    for (const scheme of schemes) {
      const doc = await ExaminationScheme.findOneAndUpdate(
        { schemeCode: scheme.schemeCode },
        { $set: scheme },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdSchemes.push(doc);
      log(`  ✓ Examination Scheme: ${scheme.schemeName} [${scheme.schemeCode}]`);
    }

    log(`[MP-RMS Schemes] SUCCESS: Seeded ${GRADE_RULES.length} Grade Rules, ${PASSING_RULES.length} Passing Rules, and ${schemes.length} Examination Schemes.`);

    return {
      success: true,
      gradeRulesCount: GRADE_RULES.length,
      passingRulesCount: PASSING_RULES.length,
      schemesCount: schemes.length,
      gradeRuleMap,
      passingRuleMap
    };
  } catch (err) {
    console.error('[MP-RMS Schemes Error]:', err.message);
    throw err;
  }
}

module.exports = {
  GRADE_RULES,
  PASSING_RULES,
  getSchemeDefinitions,
  seedAllSchemes
};
