const { ROLE_PERMISSIONS, ROLES } = require('../constants/roles');

/**
 * Grant access to specific roles or fine-grained permissions
 */
const authorize = (...rolesOrPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin has super-user access
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Direct role match
    if (rolesOrPermissions.includes(req.user.role)) {
      return next();
    }

    // Combined user permissions (role permissions + custom permissions)
    const userPerms = [
      ...(ROLE_PERMISSIONS[req.user.role] || []),
      ...(req.user.customPermissions || [])
    ];

    // Permission match
    const hasPerm = rolesOrPermissions.some((item) => userPerms.includes(item));
    if (hasPerm) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `User role '${req.user.role}' is not authorized to access this resource.`
    });
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

    const userPerms = [
      ...(ROLE_PERMISSIONS[req.user.role] || []),
      ...(req.user.customPermissions || [])
    ];
    const hasPerm = permissions.some((p) => userPerms.includes(p));

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
