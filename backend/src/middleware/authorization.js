const { buildPermissionError } = require('../utils/permissions');
const { normalizeRole } = require('../utils/roles');

const allowedRoles = new Set(['ADMIN', 'DEVELOPER', 'VIEWER']);

const authorizeRoles = (action, ...roles) => {
  if (typeof action !== 'string') {
    roles = [action, ...roles];
    action = 'perform this action';
  }

  const invalidRole = roles.find((role) => !allowedRoles.has(role));
  if (invalidRole) {
    throw new Error(`Unsupported authorization role: ${invalidRole}`);
  }

  return (req, res, next) => {
    const userRole = normalizeRole(req.user?.role);
    if (!req.user || !roles.includes(userRole)) {
      return res.status(403).json({
        message: buildPermissionError(action, roles)
      });
    }
    return next();
  };
};

module.exports = authorizeRoles;
