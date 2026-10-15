const ROLE_PERMISSIONS = {
  ADMIN: [
    'Create tickets',
    'Edit tickets',
    'Delete tickets',
    'Move tickets',
    'Manage users',
  ],
  DEVELOPER: [
    'Create tickets',
    'Edit assigned tickets',
    'Move tickets',
  ],
  VIEWER: ['View tickets only'],
};

const formatRequiredRoles = (roles) => {
  if (roles.length === 1) {
    return roles[0];
  }

  return `${roles.slice(0, -1).join(', ')} or ${roles[roles.length - 1]}`;
};

const buildPermissionError = (action, roles) => {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  return `You do not have permission to ${action}. Required role: ${formatRequiredRoles(requiredRoles)}.`;
};

module.exports = {
  ROLE_PERMISSIONS,
  buildPermissionError,
  formatRequiredRoles,
};
