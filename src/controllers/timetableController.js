const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');
const TeacherAllocation = require('../models/TeacherAllocation');
const Staff = require('../models/Staff');

// Helper to convert HH:mm or HH:mm AM/PM to minutes
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

// Helper to convert minutes to HH:mm (24hr string)
const minutesToTimeStr = (minutes) => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// @desc    Get timetable for a class & section or entire week
// @route   GET /api/timetable
exports.getTimetable = async (req, res, next) => {
  try {
    const { session, className, sectionName, dayOfWeek } = req.query;
    if (!session || !className || !sectionName) {
      return res.status(400).json({ success: false, message: 'Session, Class and Section are required' });
    }

    let query = {
      academicSession: session,
      className: className.toUpperCase(),
      sectionName: sectionName.toUpperCase()
    };
    if (dayOfWeek) query.dayOfWeek = dayOfWeek.toUpperCase();

    const timetable = await Timetable.find(query).sort({ dayOfWeek: 1 });
    res.status(200).json({ success: true, count: timetable.length, data: timetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Update timetable for a day
// @route   POST /api/timetable
exports.saveDayTimetable = async (req, res, next) => {
  try {
    const { academicSession, className, sectionName, dayOfWeek, periods } = req.body;

    const timetable = await Timetable.findOneAndUpdate(
      {
        academicSession,
        className: className.toUpperCase(),
        sectionName: sectionName.toUpperCase(),
        dayOfWeek: dayOfWeek.toUpperCase()
      },
      {
        academicSession,
        className: className.toUpperCase(),
        sectionName: sectionName.toUpperCase(),
        dayOfWeek: dayOfWeek.toUpperCase(),
        periods
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `Timetable updated for ${className}-${sectionName} (${dayOfWeek})`,
      data: timetable
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auto-generate timetable for a class & section across full week
// @route   POST /api/timetable/auto-generate
exports.autoGenerateClassTimetable = async (req, res, next) => {
  try {
    const {
      academicSession,
      className,
      sectionName = 'A',
      schoolStartTime = '08:00',
      schoolEndTime = '14:00',
      periodDuration = 45,
      recessStartTime = '11:00',
      recessDuration = 30,
      assemblyDuration = 0,
      days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      saveImmediately = false
    } = req.body;

    if (!academicSession || !className) {
      return res.status(400).json({
        success: false,
        message: 'Academic session and class name are required'
      });
    }

    const cleanClass = className.trim().toUpperCase();
    const cleanSection = (sectionName || 'A').trim().toUpperCase();

    // 1. Calculate Time Slots
    let startMin = timeToMinutes(schoolStartTime);
    const endMin = timeToMinutes(schoolEndTime);
    const pDuration = parseInt(periodDuration, 10) || 45;
    const rDuration = parseInt(recessDuration, 10) || 30;
    const aDuration = parseInt(assemblyDuration, 10) || 0;

    if (aDuration > 0) {
      startMin += aDuration;
    }

    if (startMin >= endMin) {
      return res.status(400).json({
        success: false,
        message: 'School start time must be before end time'
      });
    }

    const targetRecessMin = recessStartTime ? timeToMinutes(recessStartTime) : null;
    const slotTemplates = [];
    let curr = startMin;
    let periodIndex = 1;
    let breakPlaced = false;

    while (curr + pDuration <= endMin) {
      // If recess time reached and break not yet placed
      if (!breakPlaced && targetRecessMin && curr >= targetRecessMin) {
        slotTemplates.push({
          isBreak: true,
          periodNumber: 0,
          startTime: minutesToTimeStr(curr),
          endTime: minutesToTimeStr(curr + rDuration),
          subjectName: 'Recess / Lunch Break',
          subjectCode: 'RECESS',
          teacherName: '',
          roomNo: ''
        });
        curr += rDuration;
        breakPlaced = true;
        continue;
      }

      slotTemplates.push({
        isBreak: false,
        periodNumber: periodIndex++,
        startTime: minutesToTimeStr(curr),
        endTime: minutesToTimeStr(curr + pDuration),
        roomNo: `Room ${cleanClass}`
      });
      curr += pDuration;
    }

    // If break was not placed yet because targetRecessMin was not given or outside range
    if (!breakPlaced && slotTemplates.length >= 3) {
      const mid = Math.floor(slotTemplates.length / 2);
      // Recalculate with break in the middle
      const finalSlots = [];
      let clock = startMin;
      let pNum = 1;

      for (let i = 0; i < slotTemplates.length; i++) {
        if (i === mid) {
          finalSlots.push({
            isBreak: true,
            periodNumber: 0,
            startTime: minutesToTimeStr(clock),
            endTime: minutesToTimeStr(clock + rDuration),
            subjectName: 'Recess / Lunch Break',
            subjectCode: 'RECESS',
            teacherName: '',
            roomNo: ''
          });
          clock += rDuration;
        }

        if (clock + pDuration <= endMin) {
          finalSlots.push({
            isBreak: false,
            periodNumber: pNum++,
            startTime: minutesToTimeStr(clock),
            endTime: minutesToTimeStr(clock + pDuration),
            roomNo: `Room ${cleanClass}`
          });
          clock += pDuration;
        }
      }
      slotTemplates.length = 0;
      slotTemplates.push(...finalSlots);
    }

    // Determine Class Wing & Cadre
    const classNum = parseInt(cleanClass, 10);
    let targetWing = 'SECONDARY';
    let targetCadre = 'TGT';

    if (!isNaN(classNum)) {
      if (classNum >= 1 && classNum <= 5) {
        targetWing = 'PRIMARY';
        targetCadre = 'PRT';
      } else if (classNum >= 6 && classNum <= 8) {
        targetWing = 'MIDDLE';
        targetCadre = 'TGT';
      } else if (classNum >= 9 && classNum <= 10) {
        targetWing = 'SECONDARY';
        targetCadre = 'TGT';
      } else if (classNum >= 11 && classNum <= 12) {
        targetWing = 'SENIOR_SECONDARY';
        targetCadre = 'PGT';
      }
    }

    // 2. Fetch Subjects, Teacher Allocations, and Academic Staff
    const [allSubjects, allocations, academicStaff] = await Promise.all([
      Subject.find({ isActive: true }).sort({ displayOrder: 1, subjectName: 1 }),
      TeacherAllocation.find({
        academicSession,
        className: cleanClass,
        sectionName: cleanSection
      }),
      Staff.find({ department: 'ACADEMIC', isActive: true })
    ]);

    // Filter staff eligible for this specific class wing (PRT for Primary, TGT for Secondary, PGT for Senior)
    const eligibleWingStaff = academicStaff.filter((st) => {
      // 1. Explicit teaching wings array
      if (st.teachingWings && st.teachingWings.length > 0) {
        if (st.teachingWings.includes(targetWing) || st.teachingWings.includes('ALL')) return true;
      }
      // 2. Explicit Cadre match
      if (st.cadre && (st.cadre === targetCadre || st.cadre === 'SPECIALIST')) return true;

      // 3. Designation heuristics (e.g. PRT, TGT, PGT, Primary, Secondary)
      const des = (st.designation || '').toUpperCase();
      if (targetWing === 'PRIMARY' && (des.includes('PRT') || des.includes('PRIMARY'))) return true;
      if ((targetWing === 'MIDDLE' || targetWing === 'SECONDARY') && (des.includes('TGT') || des.includes('SECONDARY') || des.includes('HIGH SCHOOL'))) return true;
      if (targetWing === 'SENIOR_SECONDARY' && (des.includes('PGT') || des.includes('LECTURER') || des.includes('HIGHER SEC'))) return true;

      // 4. Default unclassified staff (ensure not an obvious cross-wing mismatch)
      if (!st.cadre && (!st.teachingWings || st.teachingWings.length === 0)) {
        if (targetWing === 'PRIMARY' && (des.includes('PGT') || des.includes('TGT'))) return false;
        if (targetWing === 'SENIOR_SECONDARY' && des.includes('PRT')) return false;
        return true;
      }
      return false;
    });

    // Helper to find eligible wing teacher by subject specialization
    const findWingTeacherForSubject = (subjName, subjCode) => {
      const sName = (subjName || '').toUpperCase();
      const sClean = sName.replace(/\(.*?\)/g, '').trim();
      const sCode = (subjCode || '').toUpperCase();

      const match = eligibleWingStaff.find((st) => {
        const pSub = (st.primarySubject || '').toUpperCase().trim();
        const des = (st.designation || '').toUpperCase().trim();
        if (pSub && (sName.includes(pSub) || sClean.includes(pSub) || pSub.includes(sClean))) return true;
        if (sClean && (des.includes(sClean) || sClean.includes(des.replace(/TGT|PGT|PRT/g, '').trim()))) return true;
        if (sCode && (des.includes(sCode) || pSub.includes(sCode))) return true;
        return false;
      });

      return match ? match.fullName : '';
    };

    // Map allocations by subjectCode or subjectName
    const teacherMap = new Map();
    allocations.forEach((alloc) => {
      if (alloc.subjectCode) teacherMap.set(alloc.subjectCode.toUpperCase(), alloc.teacherName);
      if (alloc.subjectName) teacherMap.set(alloc.subjectName.toUpperCase(), alloc.teacherName);
    });

    // Filter applicable subjects for this class
    const classSubjects = allSubjects.filter((s) => {
      if (!s.applicableClasses || s.applicableClasses.length === 0) return true;
      const app = s.applicableClasses.map((c) => String(c).toUpperCase());
      return app.includes(cleanClass) || app.includes('ALL');
    });

    const activeList = classSubjects.length > 0 ? classSubjects : allSubjects;

    // Categorize: Core/Academic vs Activity/Co-curricular
    const coCurricularKeywords = ['PHYSICAL', 'SPORTS', 'GAMES', 'YOGA', 'ART', 'CRAFT', 'MUSIC', 'DANCE', 'LIBRARY', 'MORAL', 'VALUE', 'GK', 'GENERAL KNOWLEDGE'];
    const coreSubjects = [];
    const coCurricularSubjects = [];

    activeList.forEach((s) => {
      const nameUpper = (s.subjectName || '').toUpperCase();
      const isCoCurr = coCurricularKeywords.some((kw) => nameUpper.includes(kw));

      // 1st Priority: Dedicated teacher allocation for this class & section
      let assignedTeacher = teacherMap.get((s.subjectCode || '').toUpperCase()) || teacherMap.get(nameUpper) || '';

      // 2nd Priority: Auto-match eligible staff from the correct teaching wing (PRT/TGT/PGT) by subject
      if (!assignedTeacher) {
        assignedTeacher = findWingTeacherForSubject(s.subjectName, s.subjectCode);
      }

      const subjectItem = {
        subjectCode: s.subjectCode || '',
        subjectName: s.subjectName || '',
        teacherName: assignedTeacher
      };
      if (isCoCurr) {
        coCurricularSubjects.push(subjectItem);
      } else {
        coreSubjects.push(subjectItem);
      }
    });

    // Ensure fallback if empty
    if (coreSubjects.length === 0) {
      coreSubjects.push(
        { subjectCode: 'HIN', subjectName: 'Hindi', teacherName: findWingTeacherForSubject('Hindi', 'HIN') },
        { subjectCode: 'ENG', subjectName: 'English', teacherName: findWingTeacherForSubject('English', 'ENG') },
        { subjectCode: 'MATH', subjectName: 'Mathematics', teacherName: findWingTeacherForSubject('Mathematics', 'MATH') },
        { subjectCode: 'SCI', subjectName: 'Science', teacherName: findWingTeacherForSubject('Science', 'SCI') },
        { subjectCode: 'SOC', subjectName: 'Social Science', teacherName: findWingTeacherForSubject('Social Science', 'SOC') }
      );
    }
    if (coCurricularSubjects.length === 0) {
      coCurricularSubjects.push(
        { subjectCode: 'COMP', subjectName: 'Computer / IT', teacherName: findWingTeacherForSubject('Computer', 'COMP') },
        { subjectCode: 'SPT', subjectName: 'Sports & PE', teacherName: findWingTeacherForSubject('Sports', 'SPT') },
        { subjectCode: 'ART', subjectName: 'Art & Craft', teacherName: findWingTeacherForSubject('Art', 'ART') },
        { subjectCode: 'LIB', subjectName: 'Library', teacherName: findWingTeacherForSubject('Library', 'LIB') }
      );
    }

    // 3. Generate Weekly Timetable
    const generatedWeek = [];
    const validDays = days && days.length > 0
      ? days.map((d) => d.toUpperCase())
      : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    validDays.forEach((day, dayIndex) => {
      const dayPeriods = [];
      let coreIndex = dayIndex % coreSubjects.length;
      let coCurrIndex = dayIndex % coCurricularSubjects.length;

      // Count non-break slots
      const nonBreakSlots = slotTemplates.filter((s) => !s.isBreak);
      const totalNonBreak = nonBreakSlots.length;

      // Reserve last slot (or 2nd to last) for co-curricular / activity if available
      const coCurrSlotPos = totalNonBreak >= 5 ? totalNonBreak - 1 : -1;
      let nonBreakCounter = 0;

      slotTemplates.forEach((template) => {
        if (template.isBreak) {
          dayPeriods.push({ ...template });
          return;
        }

        let assigned;
        if (nonBreakCounter === coCurrSlotPos && coCurricularSubjects.length > 0) {
          assigned = coCurricularSubjects[coCurrIndex % coCurricularSubjects.length];
          coCurrIndex++;
        } else {
          assigned = coreSubjects[coreIndex % coreSubjects.length];
          coreIndex++;
        }

        dayPeriods.push({
          periodNumber: template.periodNumber,
          startTime: template.startTime,
          endTime: template.endTime,
          subjectCode: assigned.subjectCode,
          subjectName: assigned.subjectName,
          teacherName: assigned.teacherName || '',
          roomNo: template.roomNo || `Room ${cleanClass}`,
          isBreak: false
        });

        nonBreakCounter++;
      });

      generatedWeek.push({
        academicSession,
        className: cleanClass,
        sectionName: cleanSection,
        dayOfWeek: day,
        periods: dayPeriods
      });
    });

    // 4. If saveImmediately, persist to Database
    if (saveImmediately) {
      for (const dayData of generatedWeek) {
        await Timetable.findOneAndUpdate(
          {
            academicSession: dayData.academicSession,
            className: dayData.className,
            sectionName: dayData.sectionName,
            dayOfWeek: dayData.dayOfWeek
          },
          {
            academicSession: dayData.academicSession,
            className: dayData.className,
            sectionName: dayData.sectionName,
            dayOfWeek: dayData.dayOfWeek,
            periods: dayData.periods
          },
          { upsert: true, new: true, runValidators: true }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: saveImmediately
        ? `Timetable automatically generated and published for Class ${cleanClass}-${cleanSection}`
        : `Timetable preview generated successfully for Class ${cleanClass}-${cleanSection}`,
      isSaved: !!saveImmediately,
      count: generatedWeek.length,
      data: generatedWeek
    });
  } catch (error) {
    next(error);
  }
};
