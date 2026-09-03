const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Stream = require('../models/Stream');
const { COMPONENT_TYPES } = require('../constants/examinationTypes');

/**
 * Standard MP Board Curriculum Subjects for Classes 1 through 12
 */
const CLASS_WISE_SUBJECT_CATALOG = [
  // ==========================================
  // PRIMARY SCHOOL (CLASSES 1, 2, 3, 4, 5)
  // ==========================================
  {
    subjectName: 'Hindi (विशिष्ट / Special)',
    subjectCode: 'HIN_PRI',
    applicableClasses: ['1', '2', '3', '4', '5'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 1,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Assessment & Activities', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'English (सामान्य / General)',
    subjectCode: 'ENG_PRI',
    applicableClasses: ['1', '2', '3', '4', '5'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 2,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Assessment & Activities', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Mathematics (गणित)',
    subjectCode: 'MATH_PRI',
    applicableClasses: ['1', '2', '3', '4', '5'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 3,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Maths Lab & Practical Activities', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Environmental Studies (पर्यावरण अध्ययन - EVS)',
    subjectCode: 'EVS_PRI',
    applicableClasses: ['3', '4', '5'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 4,
    components: [
      { name: 'Written Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Project & Environmental Activities', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Arts, Health & Physical Education (कला एवं शारीरिक शिक्षा)',
    subjectCode: 'ART_PRI',
    applicableClasses: ['1', '2', '3', '4', '5'],
    subjectType: 'OPTIONAL',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 5,
    components: [
      { name: 'Practical & Continuous Evaluation', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 100, passingMarks: 33 }
    ]
  },

  // ==========================================
  // MIDDLE SCHOOL (CLASSES 6, 7, 8)
  // ==========================================
  {
    subjectName: 'Hindi (विशिष्ट / Special)',
    subjectCode: 'HIN_MID',
    applicableClasses: ['6', '7', '8'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 1,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Project / Oral', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'English (सामान्य / General)',
    subjectCode: 'ENG_MID',
    applicableClasses: ['6', '7', '8'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 2,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Project / Oral', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Sanskrit (तृतीय भाषा / Third Language)',
    subjectCode: 'SAN_MID',
    applicableClasses: ['6', '7', '8'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 3,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Mathematics (गणित)',
    subjectCode: 'MATH_MID',
    applicableClasses: ['6', '7', '8'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 4,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Practical Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Science (विज्ञान)',
    subjectCode: 'SCI_MID',
    applicableClasses: ['6', '7', '8'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 5,
    hasPractical: true,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Practical Lab Work', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Social Science (सामाजिक विज्ञान)',
    subjectCode: 'SST_MID',
    applicableClasses: ['6', '7', '8'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 6,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Project / Map Assessment', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 25, passingMarks: 8 }
    ]
  },

  // ==========================================
  // HIGH SCHOOL (CLASSES 9 & 10 - MP BOARD 6-SUBJECT)
  // ==========================================
  {
    subjectName: 'Hindi (Special / विशिष्ट हिन्दी)',
    subjectCode: 'HIN_SEC',
    applicableClasses: ['9', '10'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 1,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'English (General / सामान्य अंग्रेजी)',
    subjectCode: 'ENG_SEC',
    applicableClasses: ['9', '10'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 2,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Sanskrit (Third Language / तृतीय भाषा)',
    subjectCode: 'SAN_SEC',
    applicableClasses: ['9', '10'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 3,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Internal Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Mathematics (गणित)',
    subjectCode: 'MATH_SEC',
    applicableClasses: ['9', '10'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 4,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Project / Practical Assessment', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Science (विज्ञान)',
    subjectCode: 'SCI_SEC',
    applicableClasses: ['9', '10'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 5,
    hasPractical: true,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Practical Lab Assessment', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 25, passingMarks: 8 }
    ]
  },
  {
    subjectName: 'Social Science (सामाजिक विज्ञान)',
    subjectCode: 'SST_SEC',
    applicableClasses: ['9', '10'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 6,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 75, passingMarks: 25 },
      { name: 'Project / Map Work', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 25, passingMarks: 8 }
    ]
  },

  // ==========================================
  // HIGHER SECONDARY (CLASSES 11 & 12 - STREAM ACADEMIC)
  // ==========================================
  // Core Languages
  {
    subjectName: 'Hindi (Core / विशिष्ट हिन्दी)',
    subjectCode: 'HIN_HSEC',
    applicableClasses: ['11', '12'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 1,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project / Oral Assessment', code: 'IA', type: COMPONENT_TYPES.PROJECT, maxMarks: 20, passingMarks: 7 }
    ]
  },
  {
    subjectName: 'English (Core / सामान्य अंग्रेजी)',
    subjectCode: 'ENG_HSEC',
    applicableClasses: ['11', '12'],
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 2,
    components: [
      { name: 'Theory Examination', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project / ASL Assessment', code: 'IA', type: COMPONENT_TYPES.PROJECT, maxMarks: 20, passingMarks: 7 }
    ]
  },

  // Science Stream Subjects
  {
    subjectName: 'Physics (भौतिक विज्ञान)',
    subjectCode: 'PHY_HSEC',
    applicableClasses: ['11', '12'],
    streamName: 'Science',
    subjectType: 'COMPULSORY',
    hasPractical: true,
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 3,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 70, passingMarks: 23 },
      { name: 'Practical Lab & Viva', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 30, passingMarks: 10 }
    ]
  },
  {
    subjectName: 'Chemistry (रसायन विज्ञान)',
    subjectCode: 'CHEM_HSEC',
    applicableClasses: ['11', '12'],
    streamName: 'Science',
    subjectType: 'COMPULSORY',
    hasPractical: true,
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 4,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 70, passingMarks: 23 },
      { name: 'Practical Lab & Record', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 30, passingMarks: 10 }
    ]
  },
  {
    subjectName: 'Mathematics (उच्च गणित)',
    subjectCode: 'MATH_HSEC',
    applicableClasses: ['11', '12'],
    streamName: 'Science',
    subjectType: 'ELECTIVE',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 5,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Internal Project / Lab', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 20, passingMarks: 7 }
    ]
  },
  {
    subjectName: 'Biology (जीव विज्ञान)',
    subjectCode: 'BIO_HSEC',
    applicableClasses: ['11', '12'],
    streamName: 'Science',
    subjectType: 'ELECTIVE',
    hasPractical: true,
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 6,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 70, passingMarks: 23 },
      { name: 'Practical Lab & Specimens', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 30, passingMarks: 10 }
    ]
  },
  {
    subjectName: 'Computer Science / IP',
    subjectCode: 'CS_HSEC',
    applicableClasses: ['11', '12'],
    streamName: 'Science',
    subjectType: 'OPTIONAL',
    hasPractical: true,
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 7,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 70, passingMarks: 23 },
      { name: 'Practical Coding Lab', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 30, passingMarks: 10 }
    ]
  },

  // Commerce Stream Subjects
  {
    subjectName: 'Accountancy (लेखाशास्त्र)',
    subjectCode: 'ACC_HSEC',
    applicableClasses: ['11', '12'],
    streamName: 'Commerce',
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 8,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project Work & Viva', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 20, passingMarks: 7 }
    ]
  },
  {
    subjectName: 'Business Studies (व्यवसाय अध्ययन)',
    subjectCode: 'BST_HSEC',
    applicableClasses: ['11', '12'],
    streamName: 'Commerce',
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 9,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project & Case Study', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 20, passingMarks: 7 }
    ]
  },
  {
    subjectName: 'Economics (अर्थशास्त्र)',
    subjectCode: 'ECO_HSEC',
    applicableClasses: ['11', '12'],
    streamName: 'Commerce',
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 10,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project Assessment', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 20, passingMarks: 7 }
    ]
  },
  {
    subjectName: 'Business Mathematics (व्यावसायिक गणित)',
    subjectCode: 'BMATH_HSEC',
    applicableClasses: ['11', '12'],
    streamName: 'Commerce',
    subjectType: 'OPTIONAL',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 11,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Internal Assessment', code: 'IA', type: COMPONENT_TYPES.INTERNAL_ASSESSMENT, maxMarks: 20, passingMarks: 7 }
    ]
  },

  // Arts / Humanities Stream Subjects
  {
    subjectName: 'History (इतिहास)',
    subjectCode: 'HIST_HSEC',
    applicableClasses: ['11', '12'],
    streamName: 'Arts / Humanities',
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 12,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project & Map Work', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 20, passingMarks: 7 }
    ]
  },
  {
    subjectName: 'Political Science (राजनीति विज्ञान)',
    subjectCode: 'POL_HSEC',
    applicableClasses: ['11', '12'],
    streamName: 'Arts / Humanities',
    subjectType: 'COMPULSORY',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 13,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project & Viva', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 20, passingMarks: 7 }
    ]
  },
  {
    subjectName: 'Geography (भूगोल)',
    subjectCode: 'GEO_HSEC',
    applicableClasses: ['11', '12'],
    streamName: 'Arts / Humanities',
    subjectType: 'COMPULSORY',
    hasPractical: true,
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 14,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 70, passingMarks: 23 },
      { name: 'Practical Geography & Survey', code: 'PR', type: COMPONENT_TYPES.PRACTICAL, maxMarks: 30, passingMarks: 10 }
    ]
  },
  {
    subjectName: 'Sociology (समाजशास्त्र)',
    subjectCode: 'SOC_HSEC',
    applicableClasses: ['11', '12'],
    streamName: 'Arts / Humanities',
    subjectType: 'OPTIONAL',
    totalMaxMarks: 100,
    totalPassingMarks: 33,
    displayOrder: 15,
    components: [
      { name: 'Theory Paper', code: 'TH', type: COMPONENT_TYPES.THEORY, maxMarks: 80, passingMarks: 26 },
      { name: 'Project Assessment', code: 'PR', type: COMPONENT_TYPES.PROJECT, maxMarks: 20, passingMarks: 7 }
    ]
  }
];

/**
 * Seeds or upserts independent, class-wise subjects for all classes (Classes 1 through 12).
 * Each class gets its own independent subject record (e.g. HIN_01 for Class 1, HIN_02 for Class 2).
 * This ensures that modifying or deleting a subject in Class 1 never affects Class 2, 3, 4, etc.
 */
async function seedAllClassSubjects({ verbose = true } = {}) {
  try {
    let createdCount = 0;
    let updatedCount = 0;

    // Resolve Stream IDs if Stream collection exists
    let streamMap = {};
    try {
      const streams = await Stream.find({ isActive: true });
      for (const s of streams) {
        streamMap[s.streamName.toLowerCase()] = s._id;
      }
    } catch (e) {
      // Streams optional
    }

    // Clean up old multi-class bundled records so they don't cause confusion
    await Subject.deleteMany({
      subjectCode: { $regex: /_(PRI|MID|SEC|HSEC)$/ }
    });

    for (const item of CLASS_WISE_SUBJECT_CATALOG) {
      for (const cls of item.applicableClasses) {
        const clsSuffix = String(cls).padStart(2, '0');
        const baseCode = item.subjectCode.replace(/_(PRI|MID|SEC|HSEC|\d+)$/, '');
        const classSpecificCode = `${baseCode}_${clsSuffix}`;

        const payload = {
          ...item,
          subjectCode: classSpecificCode,
          applicableClasses: [cls]
        };

        if (payload.streamName && streamMap[payload.streamName.toLowerCase()]) {
          payload.streamId = streamMap[payload.streamName.toLowerCase()];
        }

        const existing = await Subject.findOne({ subjectCode: classSpecificCode });

        if (!existing) {
          await Subject.create(payload);
          createdCount++;
        } else {
          await Subject.findByIdAndUpdate(existing._id, {
            applicableClasses: [cls],
            displayOrder: item.displayOrder,
            components: existing.components && existing.components.length > 0 ? existing.components : item.components
          });
          updatedCount++;
        }
      }
    }

    if (verbose) {
      console.log(`[MP-RMS Subject Seeder] Completed: ${createdCount} class-specific subjects created, ${updatedCount} verified across Classes 1-12.`);
    }

    return { success: true, createdCount, updatedCount };
  } catch (err) {
    console.error('[MP-RMS Subject Seeder Error]:', err.message);
    throw err;
  }
}

/**
 * Automatically checks whether database has subjects for all classes.
 * If any class is missing or count is 0, auto-seeds automatically without user intervention!
 */
async function autoSeedSubjectsIfEmpty() {
  try {
    const totalSubjects = await Subject.countDocuments();
    
    // Check if classes 1, 5, 8, 10, 12 have subjects
    const testClasses = ['1', '5', '8', '10', '12'];
    let needsSeed = totalSubjects === 0;

    if (!needsSeed) {
      for (const cls of testClasses) {
        const hasSub = await Subject.exists({ applicableClasses: cls });
        if (!hasSub) {
          needsSeed = true;
          break;
        }
      }
    }

    if (needsSeed) {
      console.log(`[MP-RMS Auto-Seeder] Incomplete/Missing class subjects detected. Auto-seeding Classes 1-12 subjects...`);
      await seedAllClassSubjects({ verbose: true });
    } else {
      console.log(`[MP-RMS Auto-Seeder] All Class 1-12 subjects verified (${totalSubjects} subjects loaded).`);
    }
  } catch (err) {
    console.error('[MP-RMS Auto-Seeder Error]:', err.message);
  }
}

module.exports = {
  CLASS_WISE_SUBJECT_CATALOG,
  seedAllClassSubjects,
  autoSeedSubjectsIfEmpty
};
