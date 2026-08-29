const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLE_PERMISSIONS, ROLES } = require('../constants/roles');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mp_board_rms_jwt_super_secret_key_2026_secure');
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists or is inactive.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!roles.includes(req.user.role) && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this resource`
      });
    }
    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    const userPerms = ROLE_PERMISSIONS[req.user.role] || [];
    if (userPerms.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `User lacks required permission: ${permission}`
    });
  };
};

module.exports = {
  protect,
  authorize,
  requirePermission
};
