const mongoose = require('mongoose');
const User = require('../models/User');
const AcademicSession = require('../models/AcademicSession');
const Stream = require('../models/Stream');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const SubjectCombination = require('../models/SubjectCombination');
const FeeHead = require('../models/FeeHead');
const Settings = require('../models/Settings');
const ExaminationScheme = require('../models/ExaminationScheme');

const { ROLES } = require('../constants/roles');
const { CLASS_MODES } = require('../constants/examinationTypes');
const { seedAllSchemes } = require('./schemeSeeder');
const { seedAllClassSubjects } = require('./subjectSeeder');

// Default Administrative and Staff System Users
const DEFAULT_SYSTEM_USERS = [
  {
    name: 'Dr. Rajesh Sharma (Administrator)',
    email: 'admin@mpschool.edu.in',
    password: 'admin123',
    role: ROLES.ADMIN,
    phone: '9826012345',
    designation: 'System Administrator & IT Head'
  },
  {
    name: 'Smt. Vandana Mishra',
    email: 'principal@mpschool.edu.in',
    password: 'principal123',
    role: ROLES.PRINCIPAL,
    phone: '9826023456',
    designation: 'Principal'
  },
  {
    name: 'Shri Anil Chouhan',
    email: 'exam@mpschool.edu.in',
    password: 'exam123',
    role: ROLES.EXAM_INCHARGE,
    phone: '9826034567',
    designation: 'Exam In-Charge & PGT Physics'
  },
  {
    name: 'Pooja Verma',
    email: 'teacher@mpschool.edu.in',
    password: 'teacher123',
    role: ROLES.TEACHER,
    phone: '9826045678',
    designation: 'TGT Mathematics',
    assignedClasses: ['9', '10']
  },
  {
    name: 'Rameshwar Patidar',
    email: 'accountant@mpschool.edu.in',
    password: 'accountant123',
    role: ROLES.ACCOUNTANT,
    phone: '9826056789',
    designation: 'Head Accountant & Fee Officer'
  }
];

// Academic Sessions
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

// Higher Secondary Streams
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

// Standard Classes 1 through 12
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

// Standard Fee Heads
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

// Official School Settings
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

/**
 * Seeds all core master data idempotently.
 * Safe to run on fresh databases or existing databases without wiping transaction data.
 */
async function seedMasterData(options = {}) {
  const { verbose = false } = options;
  const log = verbose ? console.log : () => {};

  try {
    log('\n=======================================================');
    log('  STARTING MP-RMS MASTER DATA SEEDING');
    log('=======================================================');

    // 1. Seed Administrative & Staff Users
    log('\n[1/10] Seeding Default Administrative & Staff Users...');
    const userMap = {};
    for (const u of DEFAULT_SYSTEM_USERS) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        existing = await User.create(u);
        log(`  ✓ Created user: ${u.name} (${u.email}) [${u.role}]`);
      } else {
        await User.updateOne(
          { _id: existing._id },
          { $set: { name: u.name, role: u.role, phone: u.phone, designation: u.designation } }
        );
        log(`  ✓ Verified user: ${u.name} (${u.email}) [${u.role}]`);
      }
      userMap[u.role] = existing;
    }

    const adminUser = userMap[ROLES.ADMIN];
    const teacherUser = userMap[ROLES.TEACHER];

    // 2. Seed Academic Sessions
    log('\n[2/10] Seeding Academic Sessions...');
    for (const session of DEFAULT_ACADEMIC_SESSIONS) {
      await AcademicSession.findOneAndUpdate(
        { sessionName: session.sessionName },
        { $set: { ...session, createdBy: adminUser?._id } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      log(`  ✓ Academic Session: ${session.sessionName} (${session.isCurrent ? 'Active' : 'Archived/Upcoming'})`);
    }

    // 3. Seed Streams
    log('\n[3/10] Seeding Higher Secondary Streams...');
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

    // 4. Seed Classes 1 to 12
    log('\n[4/10] Seeding Classes 1 through 12...');
    const classMap = {};
    for (const cls of DEFAULT_CLASSES) {
      const doc = await Class.findOneAndUpdate(
        { className: cls.className },
        { $set: cls },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      classMap[cls.className] = doc;
      log(`  ✓ Class: ${cls.displayName} [${cls.classMode}]`);
    }

    // 5. Seed Sections A and B for all classes
    log('\n[5/10] Seeding Standard Sections (A & B) for All Classes...');
    for (const [cName, cDoc] of Object.entries(classMap)) {
      await Section.findOneAndUpdate(
        { className: cName, sectionName: 'A' },
        {
          $set: {
            classId: cDoc._id,
            className: cName,
            sectionName: 'A',
            roomNumber: `Room-${100 + Number(cDoc.numericLevel)}`,
            classTeacher: teacherUser?._id,
            classTeacherName: teacherUser?.name || 'Class Teacher',
            isActive: true
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await Section.findOneAndUpdate(
        { className: cName, sectionName: 'B' },
        {
          $set: {
            classId: cDoc._id,
            className: cName,
            sectionName: 'B',
            roomNumber: `Room-${200 + Number(cDoc.numericLevel)}`,
            isActive: true
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      log(`  ✓ Sections A & B created/verified for Class ${cName}`);
    }

    // 6. Seed Grade Rules, Passing Rules & Examination Schemes
    log('\n[6/10] Seeding Grade Rules, Passing Rules & Examination Schemes...');
    const schemeResult = await seedAllSchemes({ verbose });

    // 7. Seed Curriculum Subjects for Classes 1 to 12
    log('\n[7/10] Seeding Official MP Board Subjects (Classes 1 - 12)...');
    const subjectResult = await seedAllClassSubjects({ verbose });

    // 8. Seed Subject Combinations for Class 11 and 12 Streams
    log('\n[8/10] Seeding Subject Combinations for Classes 11 & 12...');
    const sciStream = streamMap['science'] || streamMap['sci'];
    const commStream = streamMap['commerce'] || streamMap['comm'];
    const artsStream = streamMap['arts / humanities'] || streamMap['arts'];

    // Helper to find subjects by pattern
    const findSubIds = async (cls, codes) => {
      const subs = await Subject.find({
        applicableClasses: cls,
        subjectCode: { $in: codes }
      });
      return subs.map(s => s._id);
    };

    // Class 11 & 12 Combinations
    const streamClasses = ['11', '12'];
    for (const cls of streamClasses) {
      const clsPfx = cls === '11' ? '11' : '12';

      // Science PCM
      const pcmCodes = [`PHY_${clsPfx}`, `CHEM_${clsPfx}`, `HMATH_${clsPfx}`, `HIN_HSS_${clsPfx}`, `ENG_HSS_${clsPfx}`];
      const pcmSubs = await findSubIds(cls, pcmCodes);
      if (sciStream && pcmSubs.length > 0) {
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
              description: `Class ${cls} MP Board Higher Secondary Science (Physics, Chemistry, Mathematics)`
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        log(`  ✓ Subject Combination: Class ${cls} Science (PCM)`);
      }

      // Science PCB
      const pcbCodes = [`PHY_${clsPfx}`, `CHEM_${clsPfx}`, `BIO_${clsPfx}`, `HIN_HSS_${clsPfx}`, `ENG_HSS_${clsPfx}`];
      const pcbSubs = await findSubIds(cls, pcbCodes);
      if (sciStream && pcbSubs.length > 0) {
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
              description: `Class ${cls} MP Board Higher Secondary Science (Physics, Chemistry, Biology)`
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        log(`  ✓ Subject Combination: Class ${cls} Science (PCB)`);
      }

      // Commerce
      const commCodes = [`ACC_${clsPfx}`, `BST_${clsPfx}`, `ECO_${clsPfx}`, `HIN_HSS_${clsPfx}`, `ENG_HSS_${clsPfx}`];
      const commSubs = await findSubIds(cls, commCodes);
      if (commStream && commSubs.length > 0) {
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
              description: `Class ${cls} MP Board Higher Secondary Commerce (Accountancy, Business Studies, Economics)`
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        log(`  ✓ Subject Combination: Class ${cls} Commerce`);
      }

      // Arts / Humanities
      const artsCodes = [`HIST_${clsPfx}`, `POL_${clsPfx}`, `GEO_${clsPfx}`, `HIN_HSS_${clsPfx}`, `ENG_HSS_${clsPfx}`];
      const artsSubs = await findSubIds(cls, artsCodes);
      if (artsStream && artsSubs.length > 0) {
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
              description: `Class ${cls} MP Board Higher Secondary Arts (History, Political Science, Geography)`
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        log(`  ✓ Subject Combination: Class ${cls} Arts / Humanities`);
      }
    }

    // 9. Seed Fee Heads
    log('\n[9/10] Seeding Standard Fee Heads...');
    for (const head of DEFAULT_FEE_HEADS) {
      await FeeHead.findOneAndUpdate(
        { code: head.code },
        { $set: head },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      log(`  ✓ Fee Head: ${head.name} [${head.code}]`);
    }

    // 10. Seed Official School Settings
    log('\n[10/10] Seeding School Configuration & Portal Settings...');
    const settingsDoc = await Settings.findOneAndUpdate(
      { affiliationCode: DEFAULT_SETTINGS.affiliationCode },
      { $set: { ...DEFAULT_SETTINGS, updatedBy: adminUser?._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    log(`  ✓ School Settings: ${settingsDoc.schoolName} (Affiliation: ${settingsDoc.affiliationCode})`);

    log('\n=======================================================');
    log('  MP SCHOOL MASTER DATA SEEDING SUCCESSFULLY COMPLETED!');
    log('=======================================================');
    log('  Default Logins for Fresh Database:');
    log('    • Admin:       admin@mpschool.edu.in       / admin123');
    log('    • Principal:   principal@mpschool.edu.in   / principal123');
    log('    • Exam Head:   exam@mpschool.edu.in        / exam123');
    log('    • Teacher:     teacher@mpschool.edu.in     / teacher123');
    log('    • Accountant:  accountant@mpschool.edu.in  / accountant123');
    log('=======================================================\n');

    return {
      success: true,
      usersCount: DEFAULT_SYSTEM_USERS.length,
      sessionsCount: DEFAULT_ACADEMIC_SESSIONS.length,
      streamsCount: DEFAULT_STREAMS.length,
      classesCount: DEFAULT_CLASSES.length,
      feeHeadsCount: DEFAULT_FEE_HEADS.length,
      schemesResult: schemeResult,
      subjectsResult: subjectResult
    };
  } catch (err) {
    console.error('[MP-RMS Master Seeder Error]:', err.message);
    throw err;
  }
}

/**
 * Automatically inspects the connected database on server boot.
 * If fundamental master records (classes, schemes, or admin user) are missing,
 * auto-provisions them so switching databases in .env works effortlessly!
 */
async function autoSeedMasterDataIfEmpty() {
  try {
    const [userCount, classCount, schemeCount] = await Promise.all([
      User.countDocuments(),
      Class.countDocuments(),
      ExaminationScheme.countDocuments()
    ]);

    const isFreshDatabase = userCount === 0 || classCount === 0 || schemeCount === 0;

    if (isFreshDatabase) {
      console.log('[MP-RMS Auto-Setup] Fresh/Incomplete database detected (Users: ' + userCount + ', Classes: ' + classCount + ', Schemes: ' + schemeCount + ').');
      console.log('[MP-RMS Auto-Setup] Initializing foundational master data, schemes & subjects...');
      await seedMasterData({ verbose: true });
    } else {
      console.log(`[MP-RMS Master Data] Verified intact: ${classCount} Classes, ${schemeCount} Schemes, ${userCount} Users.`);
    }
  } catch (err) {
    console.error('[MP-RMS Auto-Setup Error]:', err.message);
  }
}

module.exports = {
  DEFAULT_SYSTEM_USERS,
  DEFAULT_ACADEMIC_SESSIONS,
  DEFAULT_STREAMS,
  DEFAULT_CLASSES,
  DEFAULT_FEE_HEADS,
  DEFAULT_SETTINGS,
  seedMasterData,
  autoSeedMasterDataIfEmpty
};
