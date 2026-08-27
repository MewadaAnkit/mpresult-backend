const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const academicRoutes = require('./routes/academicRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const studentRoutes = require('./routes/studentRoutes');
const schemeRoutes = require('./routes/schemeRoutes');
const examRoutes = require('./routes/examRoutes');
const marksRoutes = require('./routes/marksRoutes');
const resultRoutes = require('./routes/resultRoutes');
const externalResultRoutes = require('./routes/externalResultRoutes');
const publicRoutes = require('./routes/publicRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5174', 'http://localhost:5173'],
  credentials: true
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body Parser
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'Madhya Pradesh School & MP Board Result Management System',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/examinations', examRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/external-results', externalResultRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
