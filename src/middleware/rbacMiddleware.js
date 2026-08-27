const { ROLE_PERMISSIONS, ROLES } = require('../constants/roles');

/**
 * Grant access to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'Guest'}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

/**
 * Grant access based on specific fine-grained permissions
 */
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role === ROLES.ADMIN) {
      return next(); // Admin has all permissions
    }

    const userPerms = ROLE_PERMISSIONS[req.user.role] || [];
    const hasPerm = permissions.some(p => userPerms.includes(p));

    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You lack required permission (${permissions.join(', ')})`
      });
    }

    next();
  };
};

module.exports = {
  authorize,
  requirePermission
};
