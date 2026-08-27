const ExternalResult = require('../models/ExternalResult');
const { saveExternalResult } = require('../services/externalResultService');
const { parseBufferToRows } = require('../services/bulkImportService');
const { logAction } = require('../services/auditService');

exports.getExternalResults = async (req, res, next) => {
  try {
    const { className, sessionName, search, boardRollNo } = req.query;
    const query = {};

    if (className) query.className = className.toUpperCase();
    if (sessionName) query.sessionName = sessionName;
    if (boardRollNo) query.boardRollNo = boardRollNo;

    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { boardRollNo: { $regex: search, $options: 'i' } },
        { admissionNo: { $regex: search, $options: 'i' } },
        { applicationNo: { $regex: search, $options: 'i' } }
      ];
    }

    const results = await ExternalResult.find(query).sort({ boardRollNo: 1 });
    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (err) { next(err); }
};

exports.createExternalResult = async (req, res, next) => {
  try {
    const doc = await saveExternalResult(req.body, req.user);
    await logAction({
      req,
      action: 'IMPORT_EXTERNAL_RESULT',
      module: 'EXTERNAL',
      studentAdmissionNo: doc.admissionNo,
      description: `Saved Class ${doc.className} external board result for ${doc.studentName} (Roll: ${doc.boardRollNo})`
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.bulkImportExternalResults = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel or CSV file' });
    }

    const { className, sessionName, authorityName } = req.body;
    if (!className || !sessionName) {
      return res.status(400).json({ success: false, message: 'Class and Session Name are required' });
    }

    const rows = parseBufferToRows(req.file.buffer);
    const successful = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      const boardRollNo = String(row.RollNo || row.boardRollNo || row['Roll Number'] || '').trim();
      const studentName = String(row.StudentName || row.studentName || row.Name || '').trim();

      if (!boardRollNo || !studentName) {
        errors.push({ row: rowNum, error: 'Roll number and Student Name are required' });
        continue;
      }

      // Collect subject scores from columns if present
      const subjectScores = [];
      const standardSubjects = ['Hindi', 'English', 'Sanskrit', 'Mathematics', 'Science', 'Social_Science', 'Physics', 'Chemistry', 'Biology'];
      
      standardSubjects.forEach(sub => {
        if (row[sub] !== undefined || row[sub.replace('_', ' ')] !== undefined) {
          const val = Number(row[sub] || row[sub.replace('_', ' ')]) || 0;
          subjectScores.push({
            subjectCode: sub.substring(0, 3).toUpperCase(),
            subjectName: sub.replace('_', ' '),
            totalMaxMarks: 100,
            totalObtainedMarks: val,
            isPassed: val >= 33
          });
        }
      });

      // Fallback if subject-specific columns weren't found, check grand total
      if (subjectScores.length === 0) {
        const totalMarks = Number(row.Total || row.grandTotalObtained || row.TotalMarks) || 0;
        const maxMarks = Number(row.MaxMarks || row.grandTotalMax) || 500;
        subjectScores.push({
          subjectCode: 'ALL',
          subjectName: 'All Subjects Aggregate',
          totalMaxMarks: maxMarks,
          totalObtainedMarks: totalMarks,
          isPassed: (totalMarks / maxMarks) >= 0.33
        });
      }

      try {
        const doc = await saveExternalResult({
          boardRollNo,
          studentName,
          fatherName: row.FatherName || row.fatherName || '',
          motherName: row.MotherName || row.motherName || '',
          admissionNo: row.AdmissionNo || row.admissionNo || '',
          sessionName,
          className,
          authorityName: authorityName || 'State Examination Authority (MP)',
          subjectScores,
          importSource: 'EXCEL_IMPORT'
        }, req.user);

        successful.push({ row: rowNum, boardRollNo, studentName, percentage: doc.percentage });
      } catch (err) {
        errors.push({ row: rowNum, boardRollNo, error: err.message });
      }
    }

    await logAction({
      req,
      action: 'IMPORT_EXTERNAL_RESULT',
      module: 'EXTERNAL',
      description: `Bulk imported ${successful.length} Class ${className} external board results`
    });

    res.status(200).json({
      success: true,
      message: `Imported ${successful.length} records`,
      successful,
      errors
    });
  } catch (err) { next(err); }
};
