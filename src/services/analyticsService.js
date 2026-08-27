const Result = require('../models/Result');
const Student = require('../models/Student');
const Examination = require('../models/Examination');

/**
 * Compute detailed analytics for an examination / class
 */
const getExaminationAnalytics = async (examinationId, className, sectionName) => {
  const query = { examinationId };
  if (className) query.className = className.toUpperCase();
  if (sectionName) query.sectionName = sectionName.toUpperCase();

  const results = await Result.find(query).populate('studentId', 'studentName admissionNo gender category');

  const totalEvaluated = results.length;
  if (totalEvaluated === 0) {
    return {
      totalEvaluated: 0,
      passed: 0,
      failed: 0,
      supplementary: 0,
      passPercentage: 0,
      classAverage: 0,
      highestPercentage: 0,
      lowestPercentage: 0,
      gradeDistribution: {},
      subjectAverages: {},
      toppers: []
    };
  }

  let passed = 0;
  let failed = 0;
  let supplementary = 0;
  let totalPctSum = 0;
  let highestPercentage = 0;
  let lowestPercentage = 100;

  const gradeDistribution = {
    'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0, 'E': 0
  };

  const subjectStats = {};

  results.forEach(res => {
    if (res.resultStatus === 'PASS') passed++;
    else if (res.resultStatus === 'SUPPLEMENTARY') supplementary++;
    else failed++;

    const pct = res.overallPercentage || 0;
    totalPctSum += pct;
    if (pct > highestPercentage) highestPercentage = pct;
    if (pct < lowestPercentage) lowestPercentage = pct;

    const g = res.overallGrade || 'D';
    gradeDistribution[g] = (gradeDistribution[g] || 0) + 1;

    // Subject breakdown
    res.subjectResults.forEach(sub => {
      if (!subjectStats[sub.subjectName]) {
        subjectStats[sub.subjectName] = { totalMarksObtained: 0, totalMax: 0, count: 0, passCount: 0 };
      }
      subjectStats[sub.subjectName].totalMarksObtained += sub.totalObtainedMarks || 0;
      subjectStats[sub.subjectName].totalMax += sub.totalMaxMarks || 100;
      subjectStats[sub.subjectName].count++;
      if (sub.isPassed) subjectStats[sub.subjectName].passCount++;
    });
  });

  const classAverage = Number((totalPctSum / totalEvaluated).toFixed(2));
  const passPercentage = Number(((passed / totalEvaluated) * 100).toFixed(2));

  // Compute subject averages
  const subjectAverages = {};
  Object.keys(subjectStats).forEach(sName => {
    const s = subjectStats[sName];
    const avgScore = s.count > 0 ? Number((s.totalMarksObtained / s.count).toFixed(2)) : 0;
    const sPassPct = s.count > 0 ? Number(((s.passCount / s.count) * 100).toFixed(2)) : 0;
    subjectAverages[sName] = {
      averageMarks: avgScore,
      passPercentage: sPassPct,
      studentCount: s.count
    };
  });

  // Top 5 Toppers
  const toppers = [...results]
    .sort((a, b) => (b.overallPercentage || 0) - (a.overallPercentage || 0))
    .slice(0, 5)
    .map(t => ({
      name: t.studentId?.studentName || t.admissionNo,
      admissionNo: t.admissionNo,
      rollNo: t.rollNo,
      percentage: t.overallPercentage,
      grade: t.overallGrade,
      division: t.division
    }));

  return {
    totalEvaluated,
    passed,
    failed,
    supplementary,
    passPercentage,
    classAverage,
    highestPercentage,
    lowestPercentage: lowestPercentage === 100 && totalEvaluated === 0 ? 0 : lowestPercentage,
    gradeDistribution,
    subjectAverages,
    toppers
  };
};

module.exports = {
  getExaminationAnalytics
};
