const ExaminationScheme = require('../models/ExaminationScheme');
const Subject = require('../models/Subject');
const GradeRule = require('../models/GradeRule');
const PassingRule = require('../models/PassingRule');

/**
 * Resolve effective assessment components for a subject under a given examination scheme
 */
const resolveSubjectComponents = (scheme, subject) => {
  // If the subject has its own custom components defined and scheme allows subject override
  if (scheme.allowSubjectComponentOverride && subject.components && subject.components.length > 0) {
    return subject.components.map(comp => ({
      name: comp.name,
      code: comp.code,
      type: comp.type,
      maxMarks: comp.maxMarks,
      passingMarks: comp.passingMarks || Math.ceil(comp.maxMarks * 0.33),
      order: comp.order || 1
    }));
  }

  // Otherwise, use the scheme's standard components
  return scheme.components.map(comp => ({
    name: comp.name,
    code: comp.code,
    type: comp.type,
    maxMarks: comp.defaultMaxMarks,
    passingMarks: comp.passingMarks || Math.ceil(comp.defaultMaxMarks * 0.33),
    order: comp.order || 1
  }));
};

/**
 * Validate a set of marks against the resolved subject components
 */
const validateComponentMarks = (componentsToEnter, resolvedComponents) => {
  const errors = [];
  let calculatedTotal = 0;
  let totalMax = 0;

  for (const resolvedComp of resolvedComponents) {
    totalMax += resolvedComp.maxMarks;
    const provided = componentsToEnter.find(c => c.componentCode === resolvedComp.code);

    if (!provided) {
      errors.push(`Missing component score for: ${resolvedComp.name} (${resolvedComp.code})`);
      continue;
    }

    const val = Number(provided.obtainedMarks);
    if (isNaN(val)) {
      errors.push(`Invalid marks for ${resolvedComp.name}: must be a number`);
    } else if (val < 0) {
      errors.push(`Marks for ${resolvedComp.name} cannot be negative (got ${val})`);
    } else if (val > resolvedComp.maxMarks) {
      errors.push(`Marks for ${resolvedComp.name} (${val}) exceed maximum allowed (${resolvedComp.maxMarks})`);
    } else {
      calculatedTotal += val;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    totalObtained: calculatedTotal,
    totalMax
  };
};

module.exports = {
  resolveSubjectComponents,
  validateComponentMarks
};
