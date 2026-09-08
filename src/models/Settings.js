const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: true,
      default: 'GOVERNMENT HIGHER SECONDARY SCHOOL / MP EXCELLENCE MODEL'
    },
    schoolHindiName: {
      type: String,
      default: 'शासकीय उत्कृष्ट उच्चतर माध्यमिक विद्यालय'
    },
    schoolAddress: {
      type: String,
      default: 'District Bhopal, Madhya Pradesh - 462001'
    },
    affiliationCode: {
      type: String,
      default: 'MPBSE-SCH-712049'
    },
    udiseCode: {
      type: String,
      default: '23320108901'
    },
    boardAffiliation: {
      type: String,
      default: 'Recognized by Board of Secondary Education, Madhya Pradesh (MPBSE)'
    },
    phone: {
      type: String,
      default: '+91 755 2770000'
    },
    email: {
      type: String,
      default: 'contact@mpschool.edu.in'
    },
    website: {
      type: String,
      default: 'https://mpbse.nic.in'
    },
    // MP Sankul Kendra (Cluster) Configuration
    sankulName: {
      type: String,
      default: 'शासकीय कन्या उच्चतर माध्यमिक विद्यालय संकुल केंद्र क्रमांक 2'
    },
    sankulCode: {
      type: String,
      default: 'SKL-233201-04'
    },
    sankulPrincipalName: {
      type: String,
      default: 'संकुल प्राचार्य / संकुल समन्वयक'
    },
    sankulEmail: {
      type: String,
      default: 'sankul.kendra2@mp.gov.in'
    },
    blockName: {
      type: String,
      default: 'फंदा (Bhopal Urban)'
    },
    districtName: {
      type: String,
      default: 'भोपाल (Madhya Pradesh)'
    },
    logoLeft: {
      type: String,
      default: '' // School logo
    },
    logoRight: {
      type: String,
      default: '' // MP Emblem / MPBSE Logo
    },
    schoolSeal: {
      type: String,
      default: ''
    },
    signaturePrincipal: {
      type: String,
      default: ''
    },
    signatureExamIncharge: {
      type: String,
      default: ''
    },
    currentSession: {
      type: String,
      default: '2025-26'
    },
    enablePublicResultPortal: {
      type: Boolean,
      default: true
    },
    allowPublicPdfDownload: {
      type: Boolean,
      default: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Settings', settingsSchema);
