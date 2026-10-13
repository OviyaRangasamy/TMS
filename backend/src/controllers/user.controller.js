const mongoose = require('mongoose');
const userService = require('../services/user.service');

const USER_ROLES = ['ADMIN', 'DEVELOPER', 'VIEWER'];

const handleError = (res, error) => {
  const statusCode = error.statusCode
    || (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : null)
    || (error.code === 11000 ? 409 : 500);

  if (statusCode >= 500) {
    console.error('User request failed:', error);
  }

  return res.status(statusCode).json({
    message: statusCode >= 500 ? 'Internal server error' : error.message
  });
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json({ data: users });
  } catch (error) {
    return handleError(res, error);
  }
};

const getUserById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ data: user });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateUserRole = async (req, res) => {
  const { role } = req.body || {};
  if (!USER_ROLES.includes(role)) {
    return res.status(400).json({
      message: 'Role must be ADMIN, DEVELOPER, or VIEWER'
    });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (req.params.id.toLowerCase() === req.user.id.toLowerCase()) {
    return res.status(403).json({
      message: 'You cannot change your own role.'
    });
  }

  try {
    const user = await userService.updateUserRole(req.params.id, role);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ data: user });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole
};
