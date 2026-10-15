const User = require('../models/user.model');
const { normalizeRole } = require('../utils/roles');

const toPublicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role),
  createdAt: user.createdAt
});

const getAllUsers = async () => {
  const users = await User.find()
    .select('name email role createdAt')
    .sort({ name: 1, email: 1 });
  return users.map(toPublicUser);
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select('name email role createdAt');
  return user ? toPublicUser(user) : null;
};

const updateUserRole = async (userId, role) => {
  const currentUser = await User.findById(userId).select('role');
  if (!currentUser) {
    return null;
  }

  if (normalizeRole(currentUser.role) === 'ADMIN' && role !== 'ADMIN') {
    const adminCount = await User.countDocuments({
      role: { $regex: /^ADMIN$/i }
    });
    if (adminCount <= 1) {
      const error = new Error('Cannot change the role of the last ADMIN account.');
      error.statusCode = 409;
      throw error;
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    {
      new: true,
      runValidators: true,
      select: 'name email role createdAt'
    }
  );
  return user ? toPublicUser(user) : null;
};

module.exports = {
  getUserById,
  getAllUsers,
  updateUserRole
};
