const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    role: {
      type: String,
      required: [true, 'User role is required'],
      enum: {
        values: ['ADMIN', 'DEVELOPER', 'VIEWER'],
        message: 'Role must be ADMIN, DEVELOPER, or VIEWER'
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
