const GradeRule = require('../models/GradeRule');
const PassingRule = require('../models/PassingRule');
const ExaminationScheme = require('../models/ExaminationScheme');
const Marks = require('../models/Marks');
const Result = require('../models/Result');
const StudentEnrollment = require('../models/StudentEnrollment');
const { RESULT_STATUSES } = require('../constants/resultStatuses');

/**
 * Determine grade and remark based on percentage and GradeRule
 * BUG-026 FIX: Handles gaps in grade boundaries by finding the nearest lower boundary
 */
const determineGrade = (percentage, gradeRule) => {
  if (!gradeRule || !gradeRule.boundaries || gradeRule.boundaries.length === 0) {
    // Standard MP Board default fallback
    if (percentage >= 90) return { grade: 'A+', gradePoint: 10, remark: 'Outstanding' };
    if (percentage >= 80) return { grade: 'A', gradePoint: 9, remark: 'Excellent' };
    if (percentage >= 70) return { grade: 'B+', gradePoint: 8, remark: 'Very Good' };
    if (percentage >= 60) return { grade: 'B', gradePoint: 7, remark: 'Good' };
    if (percentage >= 50) return { grade: 'C+', gradePoint: 6, remark: 'Above Average' };
    if (percentage >= 40) return { grade: 'C', gradePoint: 5, remark: 'Average' };
    if (percentage >= 33) return { grade: 'D', gradePoint: 4, remark: 'Pass' };
    return { grade: 'E', gradePoint: 0, remark: 'Needs Improvement / Fail' };
  }

  // Sort boundaries high-to-low for fallback resolution
  const sorted = [...gradeRule.boundaries].sort((a, b) => b.minPercentage - a.minPercentage);

  // Direct match
  const boundary = sorted.find(
    b => percentage >= b.minPercentage && percentage <= b.maxPercentage
  );

  if (boundary) {
    return {
      grade: boundary.grade,
      gradePoint: boundary.gradePoint || 0,
      remark: boundary.description || boundary.remark || ''
    };
  }

  // BUG-026 FIX: Handle gaps — find nearest lower boundary
  // (e.g. if boundaries are 0-32 and 33-100 with nothing at 32.5)
  if (percentage > sorted[0].maxPercentage) {
    // Above all ranges — use highest grade
    return { grade: sorted[0].grade, gradePoint: sorted[0].gradePoint || 10, remark: sorted[0].description || '' };
  }

  // Find the highest boundary whose maxPercentage is still <= percentage
  const lowerBoundary = sorted.find(b => b.maxPercentage <= percentage);
  if (lowerBoundary) {
    return { grade: lowerBoundary.grade, gradePoint: lowerBoundary.gradePoint || 0, remark: lowerBoundary.description || '' };
  }

  // Below all ranges — use lowest grade
  const lowest = sorted[sorted.length - 1];
  return { grade: lowest.grade, gradePoint: lowest.gradePoint || 0, remark: lowest.description || '' };
};

/**
 * Determine division based on overall percentage
 * BUG-028: MP Board standard thresholds: 33%=III, 45%=II, 60%=I, 75%=Distinction
 */
const determineDivision = (percentage, resultStatus) => {
  if (resultStatus !== RESULT_STATUSES.PASS && resultStatus !== RESULT_STATUSES.PROMOTED) {
    return 'N/A';
  }
  if (percentage >= 75) return 'First Division with Distinction (I-Dist)';
  if (percentage >= 60) return 'First Division (I)';
  if (percentage >= 45) return 'Second Division (II)';
  if (percentage >= 33) return 'Third Division (III)';
  return 'N/A';
};

/**
 * Calculate complete result for a student in an examination
 */
const calculateStudentResult = async (studentId, examinationId) => {
  // 1. Fetch student marks for this examination
  const marksList = await Marks.find({ studentId, examinationId }).populate('subjectId');
  if (!marksList || marksList.length === 0) {
    throw new Error('No marks entered for this student in the selected examination');
  }

  // 2. Fetch examination with scheme, grade rule, passing rule
  const exam = await require('../models/Examination').findById(examinationId).populate({
    path: 'schemeId',
    populate: [{ path: 'gradeRuleId' }, { path: 'passingRuleId' }]
  });

  if (!exam || !exam.schemeId) {
    throw new Error('Examination or associated Examination Scheme not found');
  }

  const scheme = exam.schemeId;
  const gradeRule = scheme.gradeRuleId;
  const passingRule = scheme.passingRuleId;

  // 3. Process each subject
  let grandTotalMax = 0;
  let grandTotalObtained = 0;
  let totalGraceGiven = 0;
  let failedSubjects = [];
  const subjectResults = [];

  for (const markDoc of marksList) {
    // BUG-020 FIX: Detect ABS/EXP status per subject
    const markStatus = markDoc.status || 'PRESENT';
    const isAbsent = markStatus === 'ABS';
    const isExpelled = markStatus === 'EXP';

    const totalMax = markDoc.totalMaxMarks || 100;
    const totalObtained = isAbsent || isExpelled ? 0 : (markDoc.totalObtainedMarks || 0);
    const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
    const { grade, gradePoint } = determineGrade(isAbsent || isExpelled ? 0 : percentage, gradeRule);

    // ABS/EXP subjects are counted as fails for result purposes
    let isPassed = !isAbsent && !isExpelled;
    const subjectMinPercentage = passingRule?.subjectMinPercentage || 33;

    if (isPassed && percentage < subjectMinPercentage) {
      isPassed = false;
    }

    // Check component level pass criteria if required
    if (passingRule?.requireComponentPassing && passingRule?.componentRules?.length > 0) {
      for (const compRule of passingRule.componentRules) {
        const comp = markDoc.components.find(c => c.componentCode === compRule.componentCode);
        if (comp && comp.maxMarks > 0) {
          const compPct = (comp.obtainedMarks / comp.maxMarks) * 100;
          if (compPct < compRule.minPercentage) {
            isPassed = false;
          }
        }
      }
    }

    if (!isPassed) {
      failedSubjects.push({
        subjectName: markDoc.subjectName,
        subjectId: markDoc.subjectId?._id || markDoc.subjectId,
        isAbsent,
        isExpelled,
        totalMax,
        totalObtained,
        percentage
      });
    }

    grandTotalMax += totalMax;
    grandTotalObtained += totalObtained;

    subjectResults.push({
      subjectId: markDoc.subjectId?._id || markDoc.subjectId,
      subjectName: markDoc.subjectName,
      subjectCode: markDoc.subjectCode,
      components: markDoc.components ? JSON.parse(JSON.stringify(markDoc.components)) : [],
      totalMaxMarks: totalMax,
      totalObtainedMarks: totalObtained,
      percentage,
      grade,
      gradePoint,
      isPassed,
      status: isAbsent ? 'ABS' : isExpelled ? 'EXP' : (isPassed ? 'PASS' : 'FAIL'),
      graceMarksAwarded: 0
    });
  }

  // --- 3.1 Grace Marks Engine (MP Board Policy) ---
  const gracePolicy = passingRule?.graceMarksPolicy;
  if (gracePolicy?.allowGraceMarks && failedSubjects.length > 0) {
    const maxPerSubject = Number(gracePolicy.maxGraceMarksPerSubject) || 5;
    const maxTotal = Number(gracePolicy.maxGraceMarksTotal) || 5;
    const subjectMinPct = passingRule?.subjectMinPercentage || 33;

    // Filter failed subjects that are eligible for grace (non-absent, non-expelled)
    const eligibleForGrace = [];
    let requiredGraceTotal = 0;

    for (const fail of failedSubjects) {
      if (!fail.isAbsent && !fail.isExpelled) {
        const passingThreshold = Math.ceil((subjectMinPct / 100) * fail.totalMax);
        const shortfall = passingThreshold - fail.totalObtained;
        if (shortfall > 0 && shortfall <= maxPerSubject) {
          eligibleForGrace.push({ ...fail, shortfall });
          requiredGraceTotal += shortfall;
        }
      }
    }

    // Award grace marks if total shortfall fits within grace budget
    if (eligibleForGrace.length > 0 && requiredGraceTotal <= maxTotal) {
      for (const item of eligibleForGrace) {
        const subRes = subjectResults.find(s => String(s.subjectId) === String(item.subjectId));
        if (subRes) {
          subRes.totalObtainedMarks += item.shortfall;
          subRes.graceMarksAwarded = item.shortfall;
          subRes.percentage = Number(((subRes.totalObtainedMarks / subRes.totalMaxMarks) * 100).toFixed(2));
          const updatedGrade = determineGrade(subRes.percentage, gradeRule);
          subRes.grade = updatedGrade.grade;
          subRes.gradePoint = updatedGrade.gradePoint;
          subRes.isPassed = true;
          subRes.status = 'PASS*'; // Asterisk indicates passed with grace

          // Update primary component with grace mark flag
          if (subRes.components && subRes.components.length > 0) {
            subRes.components[0].isGraceGiven = true;
            subRes.components[0].graceMarks = item.shortfall;
            subRes.components[0].obtainedMarks += item.shortfall;
          }

          totalGraceGiven += item.shortfall;
          grandTotalObtained += item.shortfall;
        }
      }

      // Re-filter failedSubjects after grace application
      const gracePassedNames = eligibleForGrace.map(e => e.subjectName);
      failedSubjects = failedSubjects.filter(f => !gracePassedNames.includes(f.subjectName));
    }
  }

  const failedSubjectNames = failedSubjects.map(f => f.subjectName);
  let overallPercentage = grandTotalMax > 0 ? Number(((grandTotalObtained / grandTotalMax) * 100).toFixed(2)) : 0;
  const { grade: overallGrade } = determineGrade(overallPercentage, gradeRule);

  // --- 3.2 MP Board "Best of Five" Scheme (Class 10 High School) ---
  let isBestOfFiveApplied = false;
  let bestOfFiveDroppedSubject = '';
  const currentClassStr = String(marksList[0]?.className || '');
  const bestOf5Config = passingRule?.bestOfFiveRule;
  const isBestOf5Eligible =
    bestOf5Config?.isEnabled &&
    (bestOf5Config.applicableClasses || ['9', '10']).includes(currentClassStr) &&
    subjectResults.length >= 6;

  if (isBestOf5Eligible && failedSubjects.length === 1 && !failedSubjects[0].isAbsent && !failedSubjects[0].isExpelled) {
    // Student passed 5 out of 6 subjects! Drop the single failed subject from aggregate
    const dropped = failedSubjects[0];
    bestOfFiveDroppedSubject = dropped.subjectName;
    isBestOfFiveApplied = true;

    // Recompute grand total excluding the dropped subject
    const top5Subjects = subjectResults.filter(s => s.subjectName !== dropped.subjectName);
    grandTotalMax = top5Subjects.reduce((acc, s) => acc + s.totalMaxMarks, 0);
    grandTotalObtained = top5Subjects.reduce((acc, s) => acc + s.totalObtainedMarks, 0);
    overallPercentage = grandTotalMax > 0 ? Number(((grandTotalObtained / grandTotalMax) * 100).toFixed(2)) : 0;

    // Mark dropped subject on marksheet
    const droppedSub = subjectResults.find(s => s.subjectName === dropped.subjectName);
    if (droppedSub) {
      droppedSub.status = 'FAIL#'; // # indicates excluded under Best of Five
    }
  }

  // 4. Determine overall result status
  const overallMinPct = passingRule?.overallMinPercentage ?? 33;
  let resultStatus = RESULT_STATUSES.PASS;

  if (isBestOfFiveApplied) {
    // Best of Five passed
    resultStatus = RESULT_STATUSES.PASS;
  } else if (overallPercentage < overallMinPct) {
    resultStatus = RESULT_STATUSES.FAIL;
  } else if (failedSubjects.length > 0) {
    const allowSupplementary = passingRule?.supplementaryRules?.allowSupplementary ?? false;
    const maxFailedAllowed = passingRule?.supplementaryRules?.maxFailedSubjects ?? 1;
    if (allowSupplementary && failedSubjects.length <= maxFailedAllowed) {
      resultStatus = RESULT_STATUSES.SUPPLEMENTARY;
    } else {
      resultStatus = RESULT_STATUSES.FAIL;
    }
  } else {
    resultStatus = RESULT_STATUSES.PASS;
  }

  const division = determineDivision(overallPercentage, resultStatus);

  // 5. Dynamic Attendance Calculation from Attendance Model
  const Attendance = require('../models/Attendance');
  const sessionAttendances = await Attendance.find({
    academicSession: exam.sessionName,
    'records.student': studentId
  }).select('records');

  let totalWorkingDays = 0;
  let attendedDays = 0;
  for (const att of sessionAttendances) {
    const rec = att.records?.find(r => r.student && String(r.student) === String(studentId));
    if (rec && rec.status !== 'HOLIDAY') {
      totalWorkingDays++;
      if (rec.status === 'PRESENT' || rec.status === 'LATE' || rec.status === 'HALF_DAY') {
        attendedDays++;
      }
    }
  }

  const attendanceRecord = totalWorkingDays > 0 ? {
    totalWorkingDays,
    attendedDays,
    attendancePercentage: Number(((attendedDays / totalWorkingDays) * 100).toFixed(1))
  } : {
    totalWorkingDays: 220,
    attendedDays: 200,
    attendancePercentage: 90.9
  };

  // 6. Find student enrollment info for roll, section, stream
  const enrollment = await StudentEnrollment.findOne({
    studentId,
    sessionName: exam.sessionName
  });

  const student = await require('../models/Student').findById(studentId);

  // 7. Update or Create Result document
  const resultData = {
    studentId,
    admissionNo: student ? student.admissionNo : (marksList[0]?.admissionNo || ''),
    rollNo: enrollment ? enrollment.rollNo : student?.currentRollNo || '1',
    examinationId,
    sessionName: exam.sessionName,
    className: marksList[0].className,
    sectionName: marksList[0].sectionName,
    streamName: enrollment?.streamName || student?.currentStream || '',
    schemeId: scheme._id,
    schemeVersion: scheme.version || 1,
    gradeRuleId: gradeRule?._id,
    passingRuleId: passingRule?._id,
    subjectResults,
    grandTotalMax,
    grandTotalObtained,
    overallPercentage,
    overallGrade,
    division,
    resultStatus,
    failedSubjectCount: isBestOfFiveApplied ? 0 : failedSubjects.length,
    failedSubjects: isBestOfFiveApplied ? [] : failedSubjectNames,
    graceMarksGiven: totalGraceGiven,
    isBestOfFiveApplied,
    bestOfFiveDroppedSubject,
    attendance: attendanceRecord
  };

  let resultDoc = await Result.findOne({ studentId, examinationId });
  if (resultDoc) {
    Object.assign(resultDoc, resultData);
    await resultDoc.save();
  } else {
    resultDoc = await Result.create(resultData);
  }

  return resultDoc;
};

/**
 * Recalculate results for an entire class/section in an examination
 */
const calculateClassResults = async (examinationId, className, sectionName) => {
  const query = { examinationId, className };
  if (sectionName) query.sectionName = sectionName.toUpperCase();

  // Find all distinct students who have marks in this examination
  const studentIds = await Marks.distinct('studentId', query);

  const results = [];
  const errors = [];

  for (const sId of studentIds) {
    try {
      const resDoc = await calculateStudentResult(sId, examinationId);
      results.push(resDoc);
    } catch (err) {
      errors.push({ studentId: sId, error: err.message });
    }
  }

  return {
    totalProcessed: studentIds.length,
    successCount: results.length,
    errorCount: errors.length,
    errors,
    results
  };
};

module.exports = {
  determineGrade,
  determineDivision,
  calculateStudentResult,
  calculateClassResults
};
