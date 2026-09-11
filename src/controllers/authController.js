const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logAction } = require('../services/auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

// BUG-007 FIX: In-memory token blacklist for server-side JWT invalidation on logout
// Tokens are stored with their expiry timestamp and auto-purged when expired
const tokenBlacklist = new Map();

// Clean up expired tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of tokenBlacklist.entries()) {
    if (expiry < now) tokenBlacklist.delete(token);
  }
}, 60 * 60 * 1000);

exports.tokenBlacklist = tokenBlacklist;

// BUG-012 FIX: Brute-force protection — track failed login attempts per IP + email
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mp_board_rms_jwt_super_secret_key_2026_secure', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // BUG-012 FIX: Brute-force protection
    const attemptKey = `${req.ip}:${email.toLowerCase()}`;
    const attemptData = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
    const now = Date.now();

    // Reset if lockout period has passed
    if (attemptData.count >= MAX_ATTEMPTS && now - attemptData.lastAttempt < LOCKOUT_MS) {
      const remainingMs = LOCKOUT_MS - (now - attemptData.lastAttempt);
      const remainingMin = Math.ceil(remainingMs / 60000);
      return res.status(429).json({
        success: false,
        message: `Account temporarily locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`
      });
    }

    // Reset counter if lockout period has passed
    if (now - attemptData.lastAttempt >= LOCKOUT_MS) {
      attemptData.count = 0;
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      attemptData.count++;
      attemptData.lastAttempt = now;
      loginAttempts.set(attemptKey, attemptData);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact Administrator.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      attemptData.count++;
      attemptData.lastAttempt = now;
      loginAttempts.set(attemptKey, attemptData);
      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attemptData.count);
      return res.status(401).json({
        success: false,
        message: attemptsLeft > 0
          ? `Invalid credentials. ${attemptsLeft} attempt(s) remaining before account lock.`
          : 'Invalid credentials. Account locked for 15 minutes.'
      });
    }

    // Successful login — reset attempt counter
    loginAttempts.delete(attemptKey);

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    await logAction({
      req,
      user,
      action: AUDIT_ACTIONS.LOGIN,
      module: 'AUTH',
      description: `User ${user.name} (${user.email}) logged in successfully`
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        assignedClasses: user.assignedClasses,
        assignedSubjects: user.assignedSubjects,
        customPermissions: user.customPermissions || []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user — invalidate JWT server-side
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // BUG-007 FIX: Add to blacklist until it naturally expires (7 days)
      const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
      tokenBlacklist.set(token, expiry);
    }

    await logAction({
      req,
      action: AUDIT_ACTIONS.LOGOUT || 'LOGOUT',
      module: 'AUTH',
      description: `User ${req.user?.name || 'Unknown'} logged out`
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('linkedStudents');
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new user (Admin only)
 * @route   POST /api/auth/users
 * @access  Private (Admin)
 */
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, designation, assignedClasses, assignedSubjects, customPermissions } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      designation,
      assignedClasses: assignedClasses || [],
      assignedSubjects: assignedSubjects || [],
      customPermissions: customPermissions || []
    });

    await logAction({
      req,
      action: AUDIT_ACTIONS.CREATE_USER || 'CREATE_USER',
      module: 'AUTH',
      description: `Created new user: ${user.name} (${user.role})`
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/auth/users
 * @access  Private (Admin)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/auth/users/:id
 * @access  Private (Admin)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { name, role, phone, designation, assignedClasses, assignedSubjects, isActive, linkedStudents, customPermissions } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, phone, designation, assignedClasses, assignedSubjects, isActive, linkedStudents, customPermissions },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/auth/users/:id
 * @access  Private (Admin)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Safety check: Cannot delete self
    if (req.user && req.user._id && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own logged-in administrator account.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: `User account "${user.name}" deleted successfully.` });
  } catch (error) {
    next(error);
  }
};
