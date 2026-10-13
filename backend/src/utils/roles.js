const USER_ROLES = new Set(['ADMIN', 'DEVELOPER', 'VIEWER']);

const normalizeRole = (role) => {
  if (typeof role !== 'string') {
    return null;
  }

  const normalizedRole = role.trim().toUpperCase();
  return USER_ROLES.has(normalizedRole) ? normalizedRole : null;
};

module.exports = {
  normalizeRole
};
