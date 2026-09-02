const FeeHead = require('../models/FeeHead');
const FeeStructure = require('../models/FeeStructure');
const StudentFeeLedger = require('../models/StudentFeeLedger');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');

// @desc    Get all Fee Heads
// @route   GET /api/fees/heads
exports.getFeeHeads = async (req, res, next) => {
  try {
    const heads = await FeeHead.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, count: heads.length, data: heads });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Fee Head
// @route   POST /api/fees/heads
exports.createFeeHead = async (req, res, next) => {
  try {
    const { name, code, description, isOptional } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Fee Head name and code are required' });
    }
    const head = await FeeHead.create({
      name,
      code: code.toUpperCase(),
      description,
      isOptional: !!isOptional
    });
    res.status(201).json({ success: true, message: 'Fee Head created', data: head });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Fee Structures
// @route   GET /api/fees/structures
exports.getFeeStructures = async (req, res, next) => {
  try {
    const { session, className } = req.query;
    let query = {};
    if (session) query.academicSession = session;
    if (className) query.className = className.toUpperCase();

    const structures = await FeeStructure.find(query).populate('installments.items.feeHead');
    res.status(200).json({ success: true, count: structures.length, data: structures });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update Fee Structure
// @route   POST /api/fees/structures
exports.saveFeeStructure = async (req, res, next) => {
  try {
    const { academicSession, className, title, installments } = req.body;

    let annualTotal = 0;
    const cleanInstallments = installments.map((inst) => {
      let instTotal = 0;
      inst.items.forEach((item) => {
        instTotal += Number(item.amount || 0);
      });
      annualTotal += instTotal;
      return {
        ...inst,
        totalAmount: instTotal
      };
    });

    const structure = await FeeStructure.findOneAndUpdate(
      { academicSession, className: className.toUpperCase() },
      {
        academicSession,
        className: className.toUpperCase(),
        title,
        installments: cleanInstallments,
        annualTotal
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Auto-update or seed StudentFeeLedgers for active students of this class
    const students = await Student.find({
      currentSession: academicSession,
      currentClass: className.toUpperCase(),
      isActive: true
    });

    for (const student of students) {
      const existingLedger = await StudentFeeLedger.findOne({
        student: student._id,
        academicSession
      });

      if (!existingLedger) {
        await StudentFeeLedger.create({
          student: student._id,
          admissionNo: student.admissionNo,
          studentName: student.studentName,
          academicSession,
          className: student.currentClass,
          sectionName: student.currentSection,
          totalFee: annualTotal,
          discountAmount: 0,
          netFee: annualTotal,
          paidAmount: 0,
          balanceAmount: annualTotal,
          status: 'PENDING'
        });
      } else {
        const netFee = Math.max(0, annualTotal - (existingLedger.discountAmount || 0));
        const balance = Math.max(0, netFee - (existingLedger.paidAmount || 0));
        let status = 'PENDING';
        if (balance === 0 && netFee > 0) status = 'PAID';
        else if (existingLedger.paidAmount > 0) status = 'PARTIAL';

        existingLedger.totalFee = annualTotal;
        existingLedger.netFee = netFee;
        existingLedger.balanceAmount = balance;
        existingLedger.status = status;
        await existingLedger.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Fee structure saved for ${className} (${students.length} student ledgers synced)`,
      data: structure
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search student with fee ledger for collection screen
// @route   GET /api/fees/search-student
exports.searchStudentForFee = async (req, res, next) => {
  try {
    const { query, session } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search term required' });
    }

    const students = await Student.find({
      $or: [
        { admissionNo: { $regex: query, $options: 'i' } },
        { studentName: { $regex: query, $options: 'i' } },
        { mobileNo: { $regex: query, $options: 'i' } },
        { samagraId: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    const enriched = await Promise.all(
      students.map(async (st) => {
        let ledger = await StudentFeeLedger.findOne({
          student: st._id,
          academicSession: session || st.currentSession
        });

        if (!ledger) {
          // If no ledger exists, try to create from class fee structure
          const structure = await FeeStructure.findOne({
            academicSession: session || st.currentSession,
            className: st.currentClass
          });

          if (!structure) {
            // No fee structure configured — return student with null ledger and a warning
            return {
              student: st,
              ledger: null,
              warning: `No fee structure configured for Class ${st.currentClass} in session ${session || st.currentSession}. Please set up a fee structure first.`
            };
          }

          const totalFee = structure.annualTotal;
          ledger = await StudentFeeLedger.create({
            student: st._id,
            admissionNo: st.admissionNo,
            studentName: st.studentName,
            academicSession: session || st.currentSession,
            className: st.currentClass,
            sectionName: st.currentSection,
            totalFee,
            discountAmount: 0,
            netFee: totalFee,
            paidAmount: 0,
            balanceAmount: totalFee,
            status: 'PENDING'
          });
        }

        return {
          student: st,
          ledger
        };
      })
    );

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

// @desc    Collect fee payment and generate receipt
// @route   POST /api/fees/collect
exports.collectFeePayment = async (req, res, next) => {
  try {
    const {
      studentId,
      academicSession,
      amountPaid,
      paymentMode,
      transactionRef,
      discountAmount,
      discountReason,
      remarks,
      items
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Validate payment amount
    const paidAmt = Number(amountPaid);
    if (!paidAmt || paidAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    // Get current ledger to validate overpayment
    const existingLedger = await StudentFeeLedger.findOne({ student: student._id, academicSession });
    if (existingLedger) {
      const effectiveDiscount = Number(discountAmount) || existingLedger.discountAmount || 0;
      const effectiveNetFee = Math.max(0, existingLedger.totalFee - effectiveDiscount);
      const effectiveBalance = Math.max(0, effectiveNetFee - (existingLedger.paidAmount || 0));
      // Allow up to 5% tolerance for rounding/partial payments, but block significant overpayment
      if (effectiveBalance > 0 && paidAmt > effectiveBalance * 1.05) {
        return res.status(400).json({
          success: false,
          message: `Overpayment not allowed. Maximum payable amount is ₹${effectiveBalance.toFixed(2)}`
        });
      }
    }

    // Duplicate payment guard: prevent same student, same session, same amount within 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60000);
    const recentDuplicate = await FeePayment.findOne({
      student: student._id,
      academicSession,
      amountPaid: paidAmt,
      paymentDate: { $gte: sixtySecondsAgo }
    });
    if (recentDuplicate) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate payment detected. This payment was already processed within the last 60 seconds.',
        existingReceiptNo: recentDuplicate.receiptNo
      });
    }

    // Generate unique Receipt No using timestamp + random suffix to avoid race conditions
    const sessionYear = academicSession.split('-')[0] || '2026';
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    const receiptNo = `REC-${sessionYear}-${timestamp}-${randomSuffix}`;

    // Record Payment
    const payment = await FeePayment.create({
      receiptNo,
      student: student._id,
      admissionNo: student.admissionNo,
      studentName: student.studentName,
      academicSession,
      className: student.currentClass,
      sectionName: student.currentSection,
      amountPaid: Number(amountPaid),
      paymentMode,
      transactionRef: transactionRef || '',
      items: items || [{ headName: 'Tuition Fee / Composite Fee', amount: Number(amountPaid) }],
      remarks: remarks || '',
      collectedBy: req.user ? req.user._id : null,
      collectedByName: req.user ? req.user.name : 'Fee Counter'
    });

    // Update Ledger
    let ledger = await StudentFeeLedger.findOne({
      student: student._id,
      academicSession
    });

    if (!ledger) {
      ledger = new StudentFeeLedger({
        student: student._id,
        admissionNo: student.admissionNo,
        studentName: student.studentName,
        academicSession,
        className: student.currentClass,
        sectionName: student.currentSection,
        totalFee: Number(amountPaid),
        discountAmount: 0,
        netFee: Number(amountPaid),
        paidAmount: 0,
        balanceAmount: Number(amountPaid)
      });
    }

    if (discountAmount !== undefined && discountAmount !== null) {
      ledger.discountAmount = Number(discountAmount);
      ledger.discountReason = discountReason || '';
      ledger.netFee = Math.max(0, ledger.totalFee - ledger.discountAmount);
    }

    ledger.paidAmount = (ledger.paidAmount || 0) + Number(amountPaid);
    ledger.balanceAmount = Math.max(0, ledger.netFee - ledger.paidAmount);
    ledger.lastPaymentDate = new Date();

    if (ledger.balanceAmount === 0 && ledger.netFee > 0) {
      ledger.status = 'PAID';
    } else if (ledger.paidAmount > 0) {
      ledger.status = 'PARTIAL';
    } else {
      ledger.status = 'PENDING';
    }
    await ledger.save();

    res.status(201).json({
      success: true,
      message: `Fee collection successful! Receipt No: ${receiptNo}`,
      data: {
        payment,
        ledger
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get receipts / transactions history
// @route   GET /api/fees/receipts
exports.getReceipts = async (req, res, next) => {
  try {
    const { session, search, startDate, endDate } = req.query;
    let query = {};
    if (session) query.academicSession = session;
    if (search) {
      query.$or = [
        { receiptNo: { $regex: search, $options: 'i' } },
        { admissionNo: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate && endDate) {
      query.paymentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const receipts = await FeePayment.find(query).sort({ paymentDate: -1 }).limit(100);
    res.status(200).json({ success: true, count: receipts.length, data: receipts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get receipt details by ID
// @route   GET /api/fees/receipts/:id
exports.getReceiptById = async (req, res, next) => {
  try {
    const receipt = await FeePayment.findById(req.params.id).populate('student');
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    res.status(200).json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Finance analytics summary & pending dues
// @route   GET /api/fees/summary
exports.getFinancialSummary = async (req, res, next) => {
  try {
    const { session } = req.query;
    let query = {};
    if (session) query.academicSession = session;

    const ledgers = await StudentFeeLedger.find(query);
    const payments = await FeePayment.find(query);

    let totalExpected = 0;
    let totalCollected = 0;
    let totalDiscount = 0;
    let totalPending = 0;

    ledgers.forEach((l) => {
      totalExpected += l.totalFee || 0;
      totalDiscount += l.discountAmount || 0;
      totalCollected += l.paidAmount || 0;
      totalPending += l.balanceAmount || 0;
    });

    // Today's collection
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayPayments = payments.filter((p) => new Date(p.paymentDate) >= startOfToday);
    const todayCollection = todayPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalExpected,
        totalDiscount,
        totalCollected,
        totalPending,
        todayCollection,
        todayTransactionsCount: todayPayments.length,
        totalLedgersCount: ledgers.length
      }
    });
  } catch (error) {
    next(error);
  }
};
