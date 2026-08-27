const ExternalResult = require('../models/ExternalResult');
const Student = require('../models/Student');
const { determineDivision } = require('./resultCalculationService');

/**
 * Save or Import External Authority / Board Results (Class 5, 8, 10, 12)
 */
const saveExternalResult = async (resultData, user) => {
  const {
    boardRollNo,
    sessionName,
    className,
    studentName,
    admissionNo,
    subjectScores,
    authorityName
  } = resultData;

  // Calculate totals from subjectScores
  let grandTotalMax = 0;
  let grandTotalObtained = 0;
  let hasFailedSubject = false;

  const processedScores = (subjectScores || []).map(sub => {
    const sMax = Number(sub.totalMaxMarks) || (Number(sub.theoryMaxMarks || 0) + Number(sub.practicalMaxMarks || 0) + Number(sub.projectMaxMarks || 0)) || 100;
    const sObt = Number(sub.totalObtainedMarks) || (Number(sub.theoryObtainedMarks || 0) + Number(sub.practicalObtainedMarks || 0) + Number(sub.projectObtainedMarks || 0)) || 0;
    const sPct = sMax > 0 ? (sObt / sMax) * 100 : 0;
    const isPass = sPct >= 33;

    if (!isPass) hasFailedSubject = true;
    grandTotalMax += sMax;
    grandTotalObtained += sObt;

    return {
      ...sub,
      totalMaxMarks: sMax,
      totalObtainedMarks: sObt,
      isPassed: isPass
    };
  });

  const percentage = grandTotalMax > 0 ? Number(((grandTotalObtained / grandTotalMax) * 100).toFixed(2)) : 0;
  const resultStatus = percentage < 33 || hasFailedSubject ? 'FAIL' : 'PASS';
  const division = determineDivision(percentage, resultStatus);

  // Link to student if admissionNo provided
  let studentId = null;
  if (admissionNo) {
    const matched = await Student.findOne({ admissionNo: admissionNo.toUpperCase() });
    if (matched) studentId = matched._id;
  }

  const payload = {
    ...resultData,
    studentId,
    subjectScores: processedScores,
    grandTotalMax,
    grandTotalObtained,
    percentage,
    division,
    resultStatus,
    uploadedBy: user ? user._id : null
  };

  const externalDoc = await ExternalResult.findOneAndUpdate(
    { boardRollNo, sessionName, className },
    payload,
    { upsert: true, new: true }
  );

  return externalDoc;
};

module.exports = {
  saveExternalResult
};
