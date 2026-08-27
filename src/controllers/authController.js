const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logAction } = require('../services/auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

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

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact Administrator.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

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
        assignedSubjects: user.assignedSubjects
      }
    });
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
    const user = await User.findById(req.user.id);
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
    const { name, email, password, role, phone, designation, assignedClasses, assignedSubjects } = req.body;

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
      assignedSubjects: assignedSubjects || []
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
    const { name, role, phone, designation, assignedClasses, assignedSubjects, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, phone, designation, assignedClasses, assignedSubjects, isActive },
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
