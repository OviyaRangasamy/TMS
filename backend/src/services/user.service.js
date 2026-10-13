const User = require('../models/user.model');

const toPublicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role
});

const getAllUsers = async () => {
  const users = await User.find()
    .select('name email role')
    .sort({ name: 1, email: 1 });
  return users.map(toPublicUser);
};

const updateUserRole = async (userId, role) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true, select: 'name email role' }
  );
  return user ? toPublicUser(user) : null;
};

module.exports = {
  getAllUsers,
  updateUserRole
};
