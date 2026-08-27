const GradeRule = require('../models/GradeRule');
const PassingRule = require('../models/PassingRule');
const ExaminationScheme = require('../models/ExaminationScheme');
const Marks = require('../models/Marks');
const Result = require('../models/Result');
const StudentEnrollment = require('../models/StudentEnrollment');
const { RESULT_STATUSES } = require('../constants/resultStatuses');

/**
 * Determine grade and remark based on percentage and GradeRule
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

  const boundary = gradeRule.boundaries.find(
    b => percentage >= b.minPercentage && percentage <= b.maxPercentage
  );

  if (boundary) {
    return {
      grade: boundary.grade,
      gradePoint: boundary.gradePoint || 0,
      remark: boundary.description || boundary.remark || ''
    };
  }

  // If higher than max or lower than min boundary
  const sorted = [...gradeRule.boundaries].sort((a, b) => b.minPercentage - a.minPercentage);
  if (percentage >= sorted[0].maxPercentage) {
    return { grade: sorted[0].grade, gradePoint: sorted[0].gradePoint || 10, remark: sorted[0].description || '' };
  }
  const lowest = sorted[sorted.length - 1];
  return { grade: lowest.grade, gradePoint: lowest.gradePoint || 0, remark: lowest.description || '' };
};

/**
 * Determine division based on overall percentage
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
  let failedSubjects = [];
  const subjectResults = [];

  for (const markDoc of marksList) {
    const totalMax = markDoc.totalMaxMarks || 100;
    const totalObtained = markDoc.totalObtainedMarks || 0;
    const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
    const { grade, gradePoint } = determineGrade(percentage, gradeRule);

    // Check subject pass criteria
    let isPassed = true;
    const subjectMinPercentage = passingRule?.subjectMinPercentage || 33;

    if (percentage < subjectMinPercentage) {
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
      failedSubjects.push(markDoc.subjectName);
    }

    grandTotalMax += totalMax;
    grandTotalObtained += totalObtained;

    subjectResults.push({
      subjectId: markDoc.subjectId?._id || markDoc.subjectId,
      subjectName: markDoc.subjectName,
      subjectCode: markDoc.subjectCode,
      components: markDoc.components,
      totalMaxMarks: totalMax,
      totalObtainedMarks: totalObtained,
      percentage,
      grade,
      gradePoint,
      isPassed,
      status: isPassed ? 'PASS' : 'FAIL'
    });
  }

  const overallPercentage = grandTotalMax > 0 ? Number(((grandTotalObtained / grandTotalMax) * 100).toFixed(2)) : 0;
  const { grade: overallGrade } = determineGrade(overallPercentage, gradeRule);

  // 4. Determine overall result status
  const overallMinPct = passingRule?.overallMinPercentage || 33;
  let resultStatus = RESULT_STATUSES.PASS;

  if (overallPercentage < overallMinPct) {
    resultStatus = RESULT_STATUSES.FAIL;
  } else if (failedSubjects.length > 0) {
    const maxFailedAllowed = passingRule?.supplementaryRules?.maxFailedSubjects || 2;
    if (failedSubjects.length <= maxFailedAllowed && passingRule?.supplementaryRules?.allowSupplementary) {
      resultStatus = RESULT_STATUSES.SUPPLEMENTARY;
    } else {
      resultStatus = RESULT_STATUSES.FAIL;
    }
  } else {
    resultStatus = RESULT_STATUSES.PASS;
  }

  const division = determineDivision(overallPercentage, resultStatus);

  // 5. Find student enrollment info for roll, section, stream
  const enrollment = await StudentEnrollment.findOne({
    studentId,
    sessionName: exam.sessionName
  });

  const student = await require('../models/Student').findById(studentId);

  // 6. Update or Create Result document
  const resultData = {
    studentId,
    admissionNo: student ? student.admissionNo : markDoc.admissionNo,
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
    failedSubjectCount: failedSubjects.length,
    failedSubjects
  };

  let resultDoc = await Result.findOne({ studentId, examinationId });
  if (resultDoc) {
    // If previously published, preserve publish fields unless explicit reopen
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
