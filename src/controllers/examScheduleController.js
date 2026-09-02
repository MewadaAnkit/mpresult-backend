const ExamSchedule = require('../models/ExamSchedule');
const Examination = require('../models/Examination');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Announcement = require('../models/Announcement');
const AuditLog = require('../models/AuditLog');
const Settings = require('../models/Settings');
const Student = require('../models/Student');

// Helper to convert HH:mm or HH:mm AM/PM to minutes for comparison
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const str = timeStr.trim().toUpperCase();
  const isPM = str.includes('PM');
  const isAM = str.includes('AM');
  const clean = str.replace(/AM|PM/g, '').trim();
  const [h, m] = clean.split(':').map(Number);
  let hour = isNaN(h) ? 0 : h;
  const minute = isNaN(m) ? 0 : m;

  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;

  return hour * 60 + minute;
};

// Conflict Detection Engine
const detectConflicts = (newEntries, existingEntries = []) => {
  const conflicts = [];
  const allEntries = [...existingEntries, ...newEntries];

  for (let i = 0; i < allEntries.length; i++) {
    for (let j = i + 1; j < allEntries.length; j++) {
      const e1 = allEntries[i];
      const e2 = allEntries[j];

      // Ignore comparing the exact same record if editing
      if (e1._id && e2._id && e1._id.toString() === e2._id.toString()) continue;

      // Check if dates match
      const d1 = new Date(e1.examDate).toISOString().split('T')[0];
      const d2 = new Date(e2.examDate).toISOString().split('T')[0];

      if (d1 === d2) {
        // Check same class
        const sameClass = String(e1.className).trim().toUpperCase() === String(e2.className).trim().toUpperCase();
        // Check section overlap (if either is 'ALL' or matching section)
        const sameSection =
          !e1.sectionName ||
          !e2.sectionName ||
          e1.sectionName === 'ALL' ||
          e2.sectionName === 'ALL' ||
          e1.sectionName.toUpperCase() === e2.sectionName.toUpperCase();

        if (sameClass && sameSection) {
          const s1 = timeToMinutes(e1.startTime);
          const end1 = timeToMinutes(e1.endTime);
          const s2 = timeToMinutes(e2.startTime);
          const end2 = timeToMinutes(e2.endTime);

          // Overlap condition: start1 < end2 and start2 < end1
          if (s1 < end2 && s2 < end1) {
            conflicts.push({
              type: 'TIME_OVERLAP',
              message: `Time conflict on ${d1}: Class ${e1.className} has '${e1.subjectName}' (${e1.startTime}-${e1.endTime}) overlapping with '${e2.subjectName}' (${e2.startTime}-${e2.endTime}).`,
              date: d1,
              className: e1.className,
              subject1: e1.subjectName,
              subject2: e2.subjectName
            });
          }
        }
      }
    }
  }

  // Duplicate subject check in the same exam for same class/section
  const seenSubjects = {};
  for (const e of allEntries) {
    const key = `${e.examination || ''}_${e.className}_${e.sectionName || 'ALL'}_${e.subjectName}`;
    if (seenSubjects[key]) {
      conflicts.push({
        type: 'DUPLICATE_SUBJECT',
        message: `Duplicate subject: '${e.subjectName}' is scheduled multiple times for Class ${e.className} in the same examination.`,
        subject: e.subjectName,
        className: e.className
      });
    } else {
      seenSubjects[key] = true;
    }
  }

  return conflicts;
};

// @desc    Get all exam schedule entries with filters
// @route   GET /api/exam-schedules
exports.getExamSchedules = async (req, res) => {
  try {
    const {
      session,
      examinationId,
      className,
      sectionName,
      status,
      startDate,
      endDate,
      examType,
      search
    } = req.query;

    const query = {};
    if (session) query.academicSession = session;
    if (examinationId) query.examination = examinationId;
    if (className && className !== 'ALL') query.className = String(className).toUpperCase();
    if (sectionName && sectionName !== 'ALL') query.sectionName = { $in: [sectionName.toUpperCase(), 'ALL'] };
    if (status && status !== 'ALL') query.status = status;
    if (examType && examType !== 'ALL') query.examType = examType;

    if (startDate || endDate) {
      query.examDate = {};
      if (startDate) query.examDate.$gte = new Date(startDate);
      if (endDate) query.examDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { subjectName: { $regex: search, $options: 'i' } },
        { examinationName: { $regex: search, $options: 'i' } },
        { roomOrHall: { $regex: search, $options: 'i' } }
      ];
    }

    const schedules = await ExamSchedule.find(query)
      .populate('examination', 'examName examCode startDate endDate')
      .populate('subject', 'name code')
      .sort({ examDate: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (err) {
    console.error('Error fetching exam schedules:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch exam schedules',
      error: err.message
    });
  }
};

// @desc    Get Schedule Dashboard KPIs and summary stats
// @route   GET /api/exam-schedules/dashboard-stats
exports.getScheduleDashboardStats = async (req, res) => {
  try {
    const session = req.query.session || '2025-26';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const allSchedules = await ExamSchedule.find({ academicSession: session });

    let todayCount = 0;
    let upcomingCount = 0;
    let draftCount = 0;
    let publishedCount = 0;

    allSchedules.forEach((s) => {
      const dStr = new Date(s.examDate).toISOString().split('T')[0];
      if (dStr === todayStr) todayCount++;
      if (new Date(s.examDate) > now && new Date(s.examDate) <= nextWeek) upcomingCount++;
      if (s.status === 'DRAFT') draftCount++;
      if (s.status === 'PUBLISHED') publishedCount++;
    });

    const conflicts = detectConflicts(allSchedules);

    return res.status(200).json({
      success: true,
      data: {
        totalScheduled: allSchedules.length,
        todayExamsCount: todayCount,
        upcomingExamsCount: upcomingCount,
        draftCount,
        publishedCount,
        conflictsDetected: conflicts.length,
        conflictsList: conflicts
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard statistics'
    });
  }
};

// @desc    Validate and detect conflicts in candidate schedule slots
// @route   POST /api/exam-schedules/check-conflicts
exports.checkScheduleConflicts = async (req, res) => {
  try {
    const { session, examinationId, entries } = req.body;
    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ success: false, message: 'Entries array is required' });
    }

    const existing = await ExamSchedule.find({
      academicSession: session || '2025-26',
      ...(examinationId ? { examination: { $ne: examinationId } } : {})
    });

    const conflicts = detectConflicts(entries, existing);

    return res.status(200).json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflictCount: conflicts.length,
      conflicts
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Conflict check failed',
      error: err.message
    });
  }
};

// @desc    Bulk Create or Replace Exam Schedule for a Class & Exam
// @route   POST /api/exam-schedules/bulk
exports.bulkCreateExamSchedule = async (req, res) => {
  try {
    const {
      academicSession,
      examinationId,
      className,
      sections = ['ALL'],
      entries,
      applyToAllSections = false,
      status = 'DRAFT'
    } = req.body;

    if (!examinationId || !className || !entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Examination, Class, and at least one schedule entry are required.'
      });
    }

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Target sections list
    const targetSections = applyToAllSections ? ['ALL'] : (sections.length > 0 ? sections : ['ALL']);

    const newDocuments = [];

    for (const sec of targetSections) {
      for (const item of entries) {
        const d = new Date(item.examDate);
        const dayOfWeek = days[d.getDay()];

        // Calculate duration in minutes
        const startMin = timeToMinutes(item.startTime);
        const endMin = timeToMinutes(item.endTime);
        const duration = item.durationMinutes || (endMin > startMin ? endMin - startMin : 180);

        newDocuments.push({
          examination: exam._id,
          examinationName: exam.examName,
          academicSession: academicSession || exam.sessionName,
          className: String(className).toUpperCase(),
          sectionName: String(sec).toUpperCase(),
          subject: item.subjectId || null,
          subjectName: item.subjectName,
          subjectCode: item.subjectCode || '',
          examDate: d,
          dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          durationMinutes: duration,
          examType: item.examType || 'THEORY',
          roomOrHall: item.roomOrHall || 'Main Examination Hall',
          invigilatorName: item.invigilatorName || '',
          instructions: item.instructions || exam.description || 'Report 30 minutes before time with Admit Card.',
          maxMarks: Number(item.maxMarks) || 100,
          minPassingMarks: Number(item.minPassingMarks) || 33,
          status,
          createdBy: req.user?._id,
          ...(status === 'PUBLISHED' ? { publishedBy: req.user?._id, publishedAt: new Date() } : {})
        });
      }
    }

    // BUG-010 FIX: Load existing schedules for this exam/class BEFORE conflict check
    // This catches conflicts across different save operations (cross-batch conflicts)
    const existingSchedules = await ExamSchedule.find({
      examination: exam._id,
      academicSession: academicSession || exam.sessionName,
      className: String(className).toUpperCase()
    }).lean();

    // Check conflicts against BOTH existing schedules and the new batch
    const conflicts = detectConflicts(newDocuments, existingSchedules);
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot save timetable due to scheduling conflicts.',
        conflicts
      });
    }

    // Delete previous schedule for this specific exam & class & target sections
    await ExamSchedule.deleteMany({
      examination: exam._id,
      academicSession: academicSession || exam.sessionName,
      className: String(className).toUpperCase(),
      sectionName: { $in: targetSections }
    });

    const created = await ExamSchedule.insertMany(newDocuments);

    // Audit Log
    if (AuditLog) {
      await AuditLog.create({
        user: req.user?._id,
        userName: req.user?.name || 'Administrator',
        action: 'BULK_CREATE_EXAM_SCHEDULE',
        entity: 'ExamSchedule',
        details: `Created ${created.length} timetable entries for Exam '${exam.examName}' - Class ${className} (${status})`
      });
    }

    // If published, automatically post a notice circular for school
    if (status === 'PUBLISHED') {
      await Announcement.create({
        title: `Exam Timetable Published: ${exam.examName} (Class ${className})`,
        content: `The official examination schedule for ${exam.examName} (Class ${className}) has been published. All students and teachers are requested to check the timetable.`,
        audience: 'ALL',
        priority: 'HIGH',
        academicSession: academicSession || exam.sessionName,
        authorName: req.user?.name || 'Examination Department'
      }).catch((e) => console.error('Announcement creation note:', e));
    }

    return res.status(201).json({
      success: true,
      message: `Exam timetable saved successfully with ${created.length} schedule entries.`,
      count: created.length,
      data: created
    });
  } catch (err) {
    console.error('Bulk exam schedule error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to save exam schedule',
      error: err.message
    });
  }
};

// @desc    Update single Exam Schedule Entry
// @route   PUT /api/exam-schedules/:id
exports.updateExamScheduleEntry = async (req, res) => {
  try {
    const schedule = await ExamSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule entry not found' });
    }

    const updates = req.body;
    if (updates.examDate) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const d = new Date(updates.examDate);
      updates.dayOfWeek = days[d.getDay()];
    }

    if (updates.startTime && updates.endTime) {
      const startMin = timeToMinutes(updates.startTime);
      const endMin = timeToMinutes(updates.endTime);
      updates.durationMinutes = endMin > startMin ? endMin - startMin : 180;
    }

    const updated = await ExamSchedule.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      message: 'Schedule entry updated successfully',
      data: updated
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update schedule entry',
      error: err.message
    });
  }
};

// @desc    Publish Exam Schedule for a class or whole examination
// @route   POST /api/exam-schedules/publish
exports.publishExamSchedule = async (req, res) => {
  try {
    const { examinationId, className, session } = req.body;

    const query = {
      academicSession: session || '2025-26',
      ...(examinationId ? { examination: examinationId } : {}),
      ...(className && className !== 'ALL' ? { className: String(className).toUpperCase() } : {})
    };

    const result = await ExamSchedule.updateMany(query, {
      status: 'PUBLISHED',
      publishedBy: req.user?._id,
      publishedAt: new Date()
    });

    // Create School Announcement
    const exam = examinationId ? await Examination.findById(examinationId) : null;
    const examName = exam ? exam.examName : 'Semester';

    await Announcement.create({
      title: `Official Exam Schedule Released: ${examName}`,
      content: `The complete examination timetable for ${examName} ${className ? `(Class ${className})` : ''} has been officially published. Students can view their schedules in the student portal.`,
      audience: 'ALL',
      priority: 'HIGH',
      academicSession: session || '2025-26',
      authorName: req.user?.name || 'Examination Controller'
    }).catch((e) => console.error(e));

    return res.status(200).json({
      success: true,
      message: `Published ${result.modifiedCount} timetable slots successfully.`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to publish exam schedule',
      error: err.message
    });
  }
};

// @desc    Delete Exam Schedule Entry
// @route   DELETE /api/exam-schedules/:id
exports.deleteExamScheduleEntry = async (req, res) => {
  try {
    const schedule = await ExamSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule entry not found' });
    }

    await schedule.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Schedule entry deleted successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete schedule entry',
      error: err.message
    });
  }
};

// @desc    Get Printable Class Timetable with School Header
// @route   GET /api/exam-schedules/printable
exports.getPrintableClassTimetable = async (req, res) => {
  try {
    const { examinationId, className, session } = req.query;

    const [settings, exam, schedules] = await Promise.all([
      Settings.findOne(),
      Examination.findById(examinationId),
      ExamSchedule.find({
        academicSession: session || '2025-26',
        examination: examinationId,
        className: String(className).toUpperCase()
      }).sort({ examDate: 1, startTime: 1 })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        school: {
          name: settings?.schoolName || 'GOVERNMENT MODEL HIGHER SECONDARY SCHOOL OF EXCELLENCE',
          hindiName: settings?.schoolHindiName || 'शासकीय मॉडल उच्चतर माध्यमिक विद्यालय',
          address: settings?.address || 'Shivaji Nagar, Bhopal, Madhya Pradesh',
          affiliationNo: settings?.affiliationNumber || 'MPBSE-SCH-712049',
          contactNo: settings?.contactNumber || '+91 755 2551234'
        },
        examination: {
          name: exam?.examName || 'Examination',
          session: session || '2025-26',
          className
        },
        entries: schedules
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate printable timetable',
      error: err.message
    });
  }
};
