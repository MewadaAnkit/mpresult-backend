const Settings = require('../models/Settings');
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
const Examination = require('../models/Examination');
const ExamSchedule = require('../models/ExamSchedule');
const Marks = require('../models/Marks');
const Result = require('../models/Result');
const Attendance = require('../models/Attendance');
const FeeHead = require('../models/FeeHead');
const FeeStructure = require('../models/FeeStructure');
const StudentFeeLedger = require('../models/StudentFeeLedger');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');
const StudentEnrollment = require('../models/StudentEnrollment');
const Certificate = require('../models/Certificate');
const Announcement = require('../models/Announcement');
const { logAction } = require('../services/auditService');

exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ ...req.body, updatedBy: req.user._id });
    } else {
      Object.assign(settings, req.body);
      settings.updatedBy = req.user._id;
      await settings.save();
    }

    await logAction({
      req,
      action: 'UPDATE_SETTINGS',
      module: 'SETTINGS',
      description: 'Updated school settings, MPBSE affiliation, and branding'
    });

    res.status(200).json({ success: true, data: settings });
  } catch (err) { next(err); }
};

/**
 * 1-Click Complete System Database Backup Export
 */
exports.exportDatabaseBackup = async (req, res, next) => {
  try {
    const backupData = {
      system: 'MP School ERP & Result Management System',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: req.user ? `${req.user.name} (${req.user.email})` : 'System Admin',
      collections: {
        settings: await Settings.find().lean(),
        academicSessions: await AcademicSession.find().lean(),
        classes: await Class.find().lean(),
        sections: await Section.find().lean(),
        streams: await Stream.find().lean(),
        subjects: await Subject.find().lean(),
        subjectCombinations: await SubjectCombination.find().lean(),
        gradeRules: await GradeRule.find().lean(),
        passingRules: await PassingRule.find().lean(),
        schemes: await ExaminationScheme.find().lean(),
        examinations: await Examination.find().lean(),
        examSchedules: await ExamSchedule.find().lean(),
        marks: await Marks.find().lean(),
        results: await Result.find().lean(),
        attendance: await Attendance.find().lean(),
        feeHeads: await FeeHead.find().lean(),
        feeStructures: await FeeStructure.find().lean(),
        studentFeeLedgers: await StudentFeeLedger.find().lean(),
        feePayments: await FeePayment.find().lean(),
        students: await Student.find().lean(),
        studentEnrollments: await StudentEnrollment.find().lean(),
        staff: await Staff.find().lean(),
        teacherAllocations: await TeacherAllocation.find().lean(),
        certificates: await Certificate.find().lean(),
        announcements: await Announcement.find().lean(),
        users: await User.find().select('+password -__v').lean()
      }
    };

    await logAction({
      req,
      action: 'EXPORT_BACKUP',
      module: 'SETTINGS',
      description: 'Exported complete database backup file'
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `mp_school_full_backup_${timestamp}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    next(err);
  }
};

/**
 * Restore System Database from Backup Payload
 */
exports.restoreDatabaseBackup = async (req, res, next) => {
  try {
    const { backupData } = req.body;
    if (!backupData || !backupData.collections) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup file format. Expected a valid MP School ERP backup object.'
      });
    }

    const { collections } = backupData;
    const restoredSummary = {};

    const restoreCollection = async (model, docs, key) => {
      if (Array.isArray(docs) && docs.length > 0) {
        const operations = docs.map(doc => ({
          replaceOne: {
            filter: { _id: doc._id },
            replacement: doc,
            upsert: true
          }
        }));
        await model.bulkWrite(operations);
        restoredSummary[key] = docs.length;
      } else {
        restoredSummary[key] = 0;
      }
    };

    if (collections.settings) await restoreCollection(Settings, collections.settings, 'settings');
    if (collections.academicSessions) await restoreCollection(AcademicSession, collections.academicSessions, 'academicSessions');
    if (collections.classes) await restoreCollection(Class, collections.classes, 'classes');
    if (collections.sections) await restoreCollection(Section, collections.sections, 'sections');
    if (collections.streams) await restoreCollection(Stream, collections.streams, 'streams');
    if (collections.subjects) await restoreCollection(Subject, collections.subjects, 'subjects');
    if (collections.subjectCombinations) await restoreCollection(SubjectCombination, collections.subjectCombinations, 'subjectCombinations');
    if (collections.gradeRules) await restoreCollection(GradeRule, collections.gradeRules, 'gradeRules');
    if (collections.passingRules) await restoreCollection(PassingRule, collections.passingRules, 'passingRules');
    if (collections.schemes) await restoreCollection(ExaminationScheme, collections.schemes, 'schemes');
    if (collections.examinations) await restoreCollection(Examination, collections.examinations, 'examinations');
    if (collections.examSchedules) await restoreCollection(ExamSchedule, collections.examSchedules, 'examSchedules');
    if (collections.marks) await restoreCollection(Marks, collections.marks, 'marks');
    if (collections.results) await restoreCollection(Result, collections.results, 'results');
    if (collections.attendance) await restoreCollection(Attendance, collections.attendance, 'attendance');
    if (collections.feeHeads) await restoreCollection(FeeHead, collections.feeHeads, 'feeHeads');
    if (collections.feeStructures) await restoreCollection(FeeStructure, collections.feeStructures, 'feeStructures');
    if (collections.studentFeeLedgers) await restoreCollection(StudentFeeLedger, collections.studentFeeLedgers, 'studentFeeLedgers');
    if (collections.feePayments) await restoreCollection(FeePayment, collections.feePayments, 'feePayments');
    if (collections.students) await restoreCollection(Student, collections.students, 'students');
    if (collections.studentEnrollments) await restoreCollection(StudentEnrollment, collections.studentEnrollments, 'studentEnrollments');
    if (collections.staff) await restoreCollection(Staff, collections.staff, 'staff');
    if (collections.teacherAllocations) await restoreCollection(TeacherAllocation, collections.teacherAllocations, 'teacherAllocations');
    if (collections.certificates) await restoreCollection(Certificate, collections.certificates, 'certificates');
    if (collections.announcements) await restoreCollection(Announcement, collections.announcements, 'announcements');
    if (collections.users) await restoreCollection(User, collections.users, 'users');

    await logAction({
      req,
      action: 'RESTORE_BACKUP',
      module: 'SETTINGS',
      description: `Restored database backup. Collections updated: ${Object.keys(restoredSummary).length}`
    });

    res.status(200).json({
      success: true,
      message: 'System database restored successfully',
      restoredSummary
    });
  } catch (err) {
    next(err);
  }
};
