const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const Settings = require('../models/Settings');
const Student = require('../models/Student');
const Result = require('../models/Result');
const Examination = require('../models/Examination');

/**
 * Generate a dynamic, premium MP School Report Card / Marksheet
 */
const generateMarksheetPdf = async (resultId) => {
  const result = await Result.findById(resultId)
    .populate('studentId')
    .populate('examinationId');

  if (!result) {
    throw new Error('Result record not found');
  }

  const student = result.studentId || (await Student.findById(result.studentId));
  const exam = result.examinationId || (await Examination.findById(result.examinationId));
  const settings = (await Settings.findOne()) || {};

  const schoolName = settings.schoolName || 'GOVERNMENT MODEL HIGHER SECONDARY SCHOOL';
  const schoolHindiName = settings.schoolHindiName || 'शासकीय उत्कृष्ट उच्चतर माध्यमिक विद्यालय';
  const schoolAddress = settings.schoolAddress || 'Madhya Pradesh Education Department, Bhopal';
  const affiliationCode = settings.affiliationCode || 'MPBSE-CODE: 712049';
  const boardAffiliation = settings.boardAffiliation || 'Affiliated to Board of Secondary Education, M.P. (MPBSE)';

  // Generate QR Code data buffer
  const verificationUrl = `${process.env.PUBLIC_URL || 'http://localhost:5174'}/result/verify/${result.verificationCode}`;
  let qrCodeDataUrl = null;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 85 });
  } catch (qrErr) {
    console.error('QR generation failed:', qrErr.message);
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: 25,
    bufferPages: true,
    autoFirstPage: true
  });

  const primaryColor = '#1B365D'; // MP Navy/Deep Blue
  const secondaryColor = '#8B0000'; // Maroon highlight
  const darkGray = '#222222';
  const lightBg = '#F4F6F9';

  // --- Outer & Inner Borders ---
  doc.rect(15, 15, 565, 812).lineWidth(2).strokeColor(primaryColor).stroke();
  doc.rect(20, 20, 555, 802).lineWidth(0.8).strokeColor(secondaryColor).stroke();

  // --- Header Section ---
  doc.font('Helvetica-Bold').fontSize(16).fillColor(primaryColor)
    .text(schoolName.toUpperCase(), 30, 32, { width: 535, align: 'center' });

  if (schoolHindiName) {
    doc.font('Helvetica').fontSize(10).fillColor('#444444')
      .text(schoolHindiName, 30, doc.y + 2, { width: 535, align: 'center' });
  }

  doc.font('Helvetica').fontSize(8.5).fillColor('#333333')
    .text(`${schoolAddress} | ${affiliationCode}`, 30, doc.y + 2, { width: 535, align: 'center' });

  doc.font('Helvetica-Oblique').fontSize(8).fillColor(secondaryColor)
    .text(boardAffiliation, 30, doc.y + 1, { width: 535, align: 'center' });

  // Divider Line
  doc.moveTo(30, doc.y + 4).lineTo(565, doc.y + 4).lineWidth(1.5).strokeColor(primaryColor).stroke();

  // Report Card Title Banner
  const bannerY = doc.y + 8;
  doc.rect(30, bannerY, 535, 22).fill(primaryColor);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('white')
    .text(`ANNUAL ACADEMIC PROGRESS REPORT — SESSION ${result.sessionName || '2025-26'}`, 30, bannerY + 5, { width: 535, align: 'center' });

  // --- Student Details Box ---
  const boxY = bannerY + 28;
  const boxHeight = 78;
  doc.rect(30, boxY, 535, boxHeight).fill(lightBg).strokeColor('#CCCCCC').lineWidth(0.5).stroke();

  doc.fillColor(darkGray).fontSize(9);

  // Left Column
  const col1X = 40;
  const col2X = 220;
  const col3X = 400;

  // Row 1
  doc.font('Helvetica-Bold').text('Student Name:', col1X, boxY + 8);
  doc.font('Helvetica').text(student?.studentName || student?.name || 'N/A', col1X + 80, boxY + 8, { width: 140 });

  doc.font('Helvetica-Bold').text('Admission No:', col2X + 20, boxY + 8);
  doc.font('Helvetica').text(result.admissionNo || 'N/A', col2X + 95, boxY + 8);

  doc.font('Helvetica-Bold').text('Roll Number:', col3X + 20, boxY + 8);
  doc.font('Helvetica').text(result.rollNo || 'N/A', col3X + 85, boxY + 8);

  // Row 2
  doc.font('Helvetica-Bold').text("Father's Name:", col1X, boxY + 24);
  doc.font('Helvetica').text(student?.fatherName || '-', col1X + 80, boxY + 24, { width: 140 });

  doc.font('Helvetica-Bold').text('Class & Section:', col2X + 20, boxY + 24);
  doc.font('Helvetica').text(`Class ${result.className} - '${result.sectionName}'`, col2X + 95, boxY + 24);

  doc.font('Helvetica-Bold').text('Samagra ID:', col3X + 20, boxY + 24);
  doc.font('Helvetica').text(student?.samagraId || '-', col3X + 85, boxY + 24);

  // Row 3
  doc.font('Helvetica-Bold').text("Mother's Name:", col1X, boxY + 40);
  doc.font('Helvetica').text(student?.motherName || '-', col1X + 80, boxY + 40, { width: 140 });

  doc.font('Helvetica-Bold').text('Date of Birth:', col2X + 20, boxY + 40);
  const dobStr = student?.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '-';
  doc.font('Helvetica').text(dobStr, col2X + 95, boxY + 40);

  if (result.streamName) {
    doc.font('Helvetica-Bold').text('Stream:', col3X + 20, boxY + 40);
    doc.font('Helvetica').text(result.streamName, col3X + 85, boxY + 40);
  }

  // Row 4
  doc.font('Helvetica-Bold').text('Examination:', col1X, boxY + 56);
  doc.font('Helvetica').text(exam?.examName || 'Annual Evaluation Examination', col1X + 80, boxY + 56, { width: 280 });

  // --- Dynamic Subject Marks Table ---
  const tableStartY = boxY + boxHeight + 12;
  doc.y = tableStartY;

  // Determine which components exist across all subjects
  const componentCodesPresent = [];
  const componentNamesMap = {};

  result.subjectResults.forEach(sub => {
    if (sub.components && sub.components.length > 0) {
      sub.components.forEach(c => {
        if (!componentCodesPresent.includes(c.componentCode)) {
          componentCodesPresent.push(c.componentCode);
          componentNamesMap[c.componentCode] = c.componentName || c.componentCode;
        }
      });
    }
  });

  // Calculate table layout
  const subjectColWidth = 155;
  const numCompCols = Math.max(componentCodesPresent.length, 1);
  const compColWidth = numCompCols > 2 ? 50 : 65;
  const totalColWidth = 55;
  const maxColWidth = 50;
  const gradeColWidth = 45;
  const statusColWidth = 50;

  // Draw Table Header
  const tableHeadY = doc.y;
  const headerHeight = 22;

  doc.rect(30, tableHeadY, 535, headerHeight).fill(primaryColor);
  doc.fillColor('white').fontSize(8.5).font('Helvetica-Bold');

  let curX = 35;
  doc.text('SUBJECT', curX, tableHeadY + 6, { width: subjectColWidth });
  curX += subjectColWidth;

  componentCodesPresent.forEach(code => {
    doc.text(componentNamesMap[code].substring(0, 10).toUpperCase(), curX, tableHeadY + 6, { width: compColWidth, align: 'center' });
    curX += compColWidth;
  });

  doc.text('OBT.', curX, tableHeadY + 6, { width: totalColWidth, align: 'center' });
  curX += totalColWidth;

  doc.text('MAX', curX, tableHeadY + 6, { width: maxColWidth, align: 'center' });
  curX += maxColWidth;

  doc.text('GRADE', curX, tableHeadY + 6, { width: gradeColWidth, align: 'center' });
  curX += gradeColWidth;

  doc.text('STATUS', curX, tableHeadY + 6, { width: statusColWidth, align: 'center' });

  // Draw Table Rows
  let rowY = tableHeadY + headerHeight;
  const rowHeight = 20;

  doc.font('Helvetica').fontSize(8.5).fillColor(darkGray);

  result.subjectResults.forEach((sub, idx) => {
    // Alternate row backgrounds
    if (idx % 2 === 1) {
      doc.rect(30, rowY, 535, rowHeight).fill('#F8FAFC');
    }
    doc.rect(30, rowY, 535, rowHeight).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

    doc.fillColor(darkGray);
    let cellX = 35;

    // Subject Name
    doc.font('Helvetica-Bold').text(sub.subjectName, cellX, rowY + 5, { width: subjectColWidth });
    cellX += subjectColWidth;
    doc.font('Helvetica');

    // Component values
    componentCodesPresent.forEach(code => {
      const comp = sub.components?.find(c => c.componentCode === code);
      const valStr = comp ? (comp.attendanceStatus === 'PRESENT' || !comp.attendanceStatus ? `${comp.obtainedMarks}/${comp.maxMarks}` : comp.attendanceStatus) : '-';
      doc.text(valStr, cellX, rowY + 5, { width: compColWidth, align: 'center' });
      cellX += compColWidth;
    });

    // Total Obtained
    doc.font('Helvetica-Bold').text(String(sub.totalObtainedMarks), cellX, rowY + 5, { width: totalColWidth, align: 'center' });
    cellX += totalColWidth;

    // Total Max
    doc.font('Helvetica').text(String(sub.totalMaxMarks), cellX, rowY + 5, { width: maxColWidth, align: 'center' });
    cellX += maxColWidth;

    // Grade
    doc.font('Helvetica-Bold').text(sub.grade || '-', cellX, rowY + 5, { width: gradeColWidth, align: 'center' });
    cellX += gradeColWidth;

    // Status
    const isPass = sub.isPassed !== false;
    doc.fillColor(isPass ? '#166534' : '#991B1B').font('Helvetica-Bold')
      .text(sub.status || (isPass ? 'PASS' : 'FAIL'), cellX, rowY + 5, { width: statusColWidth, align: 'center' });

    rowY += rowHeight;
  });

  // Grand Total Row
  doc.rect(30, rowY, 535, rowHeight + 2).fill('#E2E8F0');
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9);

  let gtX = 35;
  doc.text('GRAND TOTAL & SUMMARY', gtX, rowY + 6, { width: subjectColWidth + (componentCodesPresent.length * compColWidth) });

  const summaryX = 35 + subjectColWidth + (componentCodesPresent.length * compColWidth);
  doc.text(String(result.grandTotalObtained), summaryX, rowY + 6, { width: totalColWidth, align: 'center' });
  doc.text(String(result.grandTotalMax), summaryX + totalColWidth, rowY + 6, { width: maxColWidth, align: 'center' });
  doc.text(result.overallGrade || '-', summaryX + totalColWidth + maxColWidth, rowY + 6, { width: gradeColWidth, align: 'center' });
  doc.text(result.resultStatus, summaryX + totalColWidth + maxColWidth + gradeColWidth, rowY + 6, { width: statusColWidth, align: 'center' });

  rowY += rowHeight + 10;

  // --- Final Results Summary & Co-Scholastic Box ---
  const summaryBoxY = rowY;
  const summaryHeight = 85;

  // Left Box: Performance Summary
  doc.rect(30, summaryBoxY, 260, summaryHeight).fill(lightBg).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
  doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor).text('ACADEMIC PERFORMANCE SUMMARY', 38, summaryBoxY + 8);

  doc.font('Helvetica').fontSize(8.5).fillColor(darkGray);
  doc.text(`Percentage: ${result.overallPercentage}%`, 38, summaryBoxY + 24);
  doc.text(`Overall Grade: ${result.overallGrade || '-'}`, 38, summaryBoxY + 38);
  doc.text(`Division: ${result.division || 'N/A'}`, 38, summaryBoxY + 52);
  doc.font('Helvetica-Bold').fillColor(result.resultStatus === 'PASS' ? '#166534' : '#991B1B')
    .text(`FINAL RESULT: ${result.resultStatus}`, 38, summaryBoxY + 66);

  // Right Box: Co-Scholastic & Attendance
  doc.rect(300, summaryBoxY, 265, summaryHeight).fill(lightBg).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
  doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor).text('CO-SCHOLASTIC EVALUATION', 308, summaryBoxY + 8);

  doc.font('Helvetica').fontSize(8).fillColor(darkGray);
  const cs = result.coScholastic || {};
  doc.text(`Work Education: ${cs.workEducation || 'A'} | Art Education: ${cs.artEducation || 'A'}`, 308, summaryBoxY + 24);
  doc.text(`Health & Physical Edu: ${cs.healthAndPhysicalEducation || 'A'} | Discipline: ${cs.discipline || 'A'}`, 308, summaryBoxY + 38);
  const att = result.attendance || {};
  doc.text(`Attendance: ${att.attendedDays || 200} / ${att.totalWorkingDays || 220} days (${att.attendancePercentage || 90.9}%)`, 308, summaryBoxY + 52);
  doc.font('Helvetica-Oblique').text(`Remarks: ${result.teacherRemarks || 'VERY GOOD'}`, 308, summaryBoxY + 66, { width: 250 });

  // --- Verification QR Code & Official Seal Section ---
  const bottomY = summaryBoxY + summaryHeight + 12;

  // Embed QR Code if available
  if (qrCodeDataUrl) {
    try {
      doc.image(qrCodeDataUrl, 35, bottomY, { width: 68 });
      doc.font('Helvetica').fontSize(6.5).fillColor('#666666')
        .text('Scan to Verify Result', 32, bottomY + 70, { width: 75, align: 'center' });
    } catch (imgErr) {
      console.error('Failed to embed QR:', imgErr);
    }
  }

  // Security Verification Tag
  doc.font('Helvetica').fontSize(7).fillColor('#555555')
    .text(`Verification Code: ${result.verificationCode}`, 115, bottomY + 10)
    .text(`System Generated Record — MP School Result Management System`, 115, bottomY + 22)
    .text(`Date of Issue: ${new Date().toLocaleDateString('en-GB')}`, 115, bottomY + 34);

  // Signatures Section
  const sigY = bottomY + 50;
  doc.font('Helvetica-Bold').fontSize(8).fillColor(darkGray);

  doc.text('_____________________', 140, sigY, { align: 'center', width: 110 });
  doc.text('Class Teacher', 140, sigY + 12, { align: 'center', width: 110 });

  doc.text('_____________________', 290, sigY, { align: 'center', width: 120 });
  doc.text('Exam In-Charge', 290, sigY + 12, { align: 'center', width: 120 });

  doc.text('_____________________', 440, sigY, { align: 'center', width: 110 });
  doc.text('Principal / Seal', 440, sigY + 12, { align: 'center', width: 110 });

  doc.end();
  return doc;
};

module.exports = {
  generateMarksheetPdf
};
