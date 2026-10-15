const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const User = require('../src/models/user.model');

const createAdmin = async () => {
  const { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;
  if (
    !ADMIN_EMAIL
    || !ADMIN_NAME
    || !ADMIN_PASSWORD
    || ADMIN_PASSWORD.length < 12
    || Buffer.byteLength(ADMIN_PASSWORD, 'utf8') > 72
  ) {
    throw new Error(
      'Set ADMIN_EMAIL, ADMIN_NAME, and an ADMIN_PASSWORD of 12-72 UTF-8 bytes'
    );
  }

  await connectDB();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (await User.exists({ email })) {
    throw new Error('An account with ADMIN_EMAIL already exists');
  }

  const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.create({
    name: ADMIN_NAME.trim(),
    email,
    password,
    role: 'ADMIN'
  });
  console.log(`Administrator account created for ${email}`);
};

createAdmin()
  .catch((error) => {
    console.error('Failed to create administrator:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
