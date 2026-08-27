const Result = require('../models/Result');
const Student = require('../models/Student');
const Examination = require('../models/Examination');
const archiver = require('archiver');
const { calculateStudentResult, calculateClassResults } = require('../services/resultCalculationService');
const { generateMarksheetPdf } = require('../services/pdfService');
const { logAction } = require('../services/auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const { APPROVAL_STAGES } = require('../constants/resultStatuses');

/**
 * Calculate result for a single student
 */
exports.calculateSingleResult = async (req, res, next) => {
  try {
    const { studentId, examinationId } = req.body;
    const result = await calculateStudentResult(studentId, examinationId);

    await logAction({
      req,
      action: AUDIT_ACTIONS.CALCULATE_RESULT,
      module: 'RESULTS',
      studentAdmissionNo: result.admissionNo,
      description: `Calculated result for student ${result.admissionNo}: ${result.overallPercentage}% (${result.resultStatus})`
    });

    res.status(200).json({ success: true, message: 'Result calculated successfully', data: result });
  } catch (err) { next(err); }
};

/**
 * Calculate result for an entire class / section
 */
exports.calculateClassResults = async (req, res, next) => {
  try {
    const { examinationId, className, sectionName } = req.body;
    const outcome = await calculateClassResults(examinationId, className, sectionName);

    await logAction({
      req,
      action: AUDIT_ACTIONS.CALCULATE_RESULT,
      module: 'RESULTS',
      description: `Batch calculated results for Class ${className} (${outcome.successCount} students)`
    });

    res.status(200).json({ success: true, message: 'Class results calculated successfully', data: outcome });
  } catch (err) { next(err); }
};

/**
 * Get results with filters
 */
exports.getResults = async (req, res, next) => {
  try {
    const { examinationId, className, sectionName, approvalStage, sessionName } = req.query;
    const query = {};

    if (examinationId) query.examinationId = examinationId;
    if (className) query.className = className.toUpperCase();
    if (sectionName) query.sectionName = sectionName.toUpperCase();
    if (approvalStage) query.approvalStage = approvalStage;
    if (sessionName) query.sessionName = sessionName;

    const results = await Result.find(query)
      .populate('studentId')
      .populate('examinationId')
      .sort({ grandTotalObtained: -1 });

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (err) { next(err); }
};

/**
 * Get result by ID
 */
exports.getResultById = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('studentId')
      .populate('examinationId')
      .populate('schemeId');

    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};

/**
 * Transition result approval stage:
 * DRAFT -> TEACHER_SUBMITTED -> EXAMINATION_VERIFIED -> PRINCIPAL_APPROVED -> PUBLISHED
 */
exports.updateApprovalStage = async (req, res, next) => {
  try {
    const { resultIds, targetStage, remarks } = req.body;

    if (!resultIds || resultIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No results selected' });
    }

    if (!Object.values(APPROVAL_STAGES).includes(targetStage)) {
      return res.status(400).json({ success: false, message: 'Invalid target approval stage' });
    }

    const updateFields = { approvalStage: targetStage };
    const now = new Date();

    if (targetStage === APPROVAL_STAGES.TEACHER_SUBMITTED) {
      updateFields.submittedBy = req.user._id;
      updateFields.submittedAt = now;
    } else if (targetStage === APPROVAL_STAGES.EXAMINATION_VERIFIED) {
      updateFields.verifiedBy = req.user._id;
      updateFields.verifiedAt = now;
    } else if (targetStage === APPROVAL_STAGES.PRINCIPAL_APPROVED) {
      updateFields.approvedBy = req.user._id;
      updateFields.approvedAt = now;
    } else if (targetStage === APPROVAL_STAGES.PUBLISHED) {
      updateFields.isPublished = true;
      updateFields.publishedAt = now;
    }

    await Result.updateMany({ _id: { $in: resultIds } }, { $set: updateFields });

    await logAction({
      req,
      action: targetStage === APPROVAL_STAGES.PUBLISHED ? AUDIT_ACTIONS.PUBLISH_RESULT : AUDIT_ACTIONS.APPROVE_RESULT,
      module: 'RESULTS',
      description: `Transitioned ${resultIds.length} results to stage: ${targetStage}`
    });

    res.status(200).json({ success: true, message: `Successfully updated ${resultIds.length} results to ${targetStage}` });
  } catch (err) { next(err); }
};

/**
 * Reopen a published result with audit reason
 */
exports.reopenResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reopen reason is mandatory' });
    }

    const result = await Result.findById(id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    const prevStage = result.approvalStage;
    result.approvalStage = APPROVAL_STAGES.DRAFT;
    result.isPublished = false;
    result.reopenHistory.push({
      reopenedBy: req.user._id,
      reopenedAt: new Date(),
      reason,
      previousStage: prevStage
    });

    await result.save();

    await logAction({
      req,
      action: AUDIT_ACTIONS.REOPEN_RESULT,
      module: 'RESULTS',
      studentAdmissionNo: result.admissionNo,
      description: `Reopened result for student ${result.admissionNo}. Reason: ${reason}`
    });

    res.status(200).json({ success: true, message: 'Result reopened for editing', data: result });
  } catch (err) { next(err); }
};

/**
 * Download single student PDF marksheet
 */
exports.downloadMarksheetPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Result.findById(id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    const doc = await generateMarksheetPdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Marksheet_${result.admissionNo}_Cls${result.className}.pdf`);

    doc.pipe(res);
  } catch (err) { next(err); }
};

/**
 * Bulk generate and download Marksheet PDFs as a ZIP archive
 */
exports.downloadBulkMarksheetsZip = async (req, res, next) => {
  try {
    const { examinationId, className, sectionName } = req.query;
    const query = { examinationId, className: className.toUpperCase() };
    if (sectionName) query.sectionName = sectionName.toUpperCase();

    const results = await Result.find(query);
    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: 'No results found matching criteria' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=Marksheets_Class_${className}_${sectionName || 'ALL'}.zip`);

    archive.pipe(res);

    for (const resDoc of results) {
      const doc = await generateMarksheetPdf(resDoc._id);
      archive.append(doc, { name: `Marksheet_${resDoc.admissionNo}_Roll${resDoc.rollNo}.pdf` });
    }

    await archive.finalize();
  } catch (err) { next(err); }
};
