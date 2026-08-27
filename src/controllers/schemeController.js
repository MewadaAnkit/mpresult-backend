const ExaminationScheme = require('../models/ExaminationScheme');
const GradeRule = require('../models/GradeRule');
const PassingRule = require('../models/PassingRule');
const { logAction } = require('../services/auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

// --- Examination Schemes ---
exports.getSchemes = async (req, res, next) => {
  try {
    const { className } = req.query;
    const query = { isActive: true };
    if (className) query.applicableClasses = className.toUpperCase();

    const schemes = await ExaminationScheme.find(query)
      .populate('gradeRuleId')
      .populate('passingRuleId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: schemes.length, data: schemes });
  } catch (err) { next(err); }
};

exports.getSchemeById = async (req, res, next) => {
  try {
    const scheme = await ExaminationScheme.findById(req.params.id)
      .populate('gradeRuleId')
      .populate('passingRuleId');
    if (!scheme) return res.status(404).json({ success: false, message: 'Examination scheme not found' });
    res.status(200).json({ success: true, data: scheme });
  } catch (err) { next(err); }
};

exports.createScheme = async (req, res, next) => {
  try {
    const scheme = await ExaminationScheme.create(req.body);
    await logAction({
      req,
      action: AUDIT_ACTIONS.CREATE_SCHEME,
      module: 'SCHEMES',
      description: `Created examination scheme: ${scheme.schemeName} (${scheme.schemeCode})`
    });
    res.status(201).json({ success: true, data: scheme });
  } catch (err) { next(err); }
};

exports.updateScheme = async (req, res, next) => {
  try {
    const scheme = await ExaminationScheme.findByIdAndUpdate(
      req.params.id,
      { ...req.body, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    await logAction({
      req,
      action: AUDIT_ACTIONS.UPDATE_SCHEME,
      module: 'SCHEMES',
      description: `Updated examination scheme: ${scheme.schemeName} (${scheme.schemeCode})`
    });
    res.status(200).json({ success: true, data: scheme });
  } catch (err) { next(err); }
};

// --- Grade Rules ---
exports.getGradeRules = async (req, res, next) => {
  try {
    const rules = await GradeRule.find({ isActive: true });
    res.status(200).json({ success: true, data: rules });
  } catch (err) { next(err); }
};

exports.createGradeRule = async (req, res, next) => {
  try {
    const rule = await GradeRule.create(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (err) { next(err); }
};

exports.updateGradeRule = async (req, res, next) => {
  try {
    const rule = await GradeRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Grade rule not found' });
    res.status(200).json({ success: true, data: rule });
  } catch (err) { next(err); }
};

// --- Passing Rules ---
exports.getPassingRules = async (req, res, next) => {
  try {
    const rules = await PassingRule.find({ isActive: true });
    res.status(200).json({ success: true, data: rules });
  } catch (err) { next(err); }
};

exports.createPassingRule = async (req, res, next) => {
  try {
    const rule = await PassingRule.create(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (err) { next(err); }
};

exports.updatePassingRule = async (req, res, next) => {
  try {
    const rule = await PassingRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Passing rule not found' });
    res.status(200).json({ success: true, data: rule });
  } catch (err) { next(err); }
};
