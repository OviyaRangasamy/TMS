const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { normalizeRole } = require('../utils/roles');

const SALT_ROUNDS = 12;
const TOKEN_LIFETIME_SECONDS = 60 * 60;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class AuthServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AuthServiceError';
    this.statusCode = statusCode;
  }
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return secret;
};

const toPublicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role)
});

const createToken = (user) =>
  jwt.sign(
    {},
    getJwtSecret(),
    {
      subject: user._id.toString(),
      expiresIn: TOKEN_LIFETIME_SECONDS,
      issuer: 'tms-api'
    }
  );

const register = async ({ name, email, password }) => {
  if (
    typeof name !== 'string'
    || name.trim().length === 0
    || typeof email !== 'string'
    || !emailPattern.test(email.trim())
    || typeof password !== 'string'
    || password.length < 12
    || Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw new AuthServiceError(
      'Provide a name, valid email, and password between 12 and 72 UTF-8 bytes',
      400
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.exists({ email: normalizedEmail });
  if (existingUser) {
    throw new AuthServiceError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: passwordHash,
    role: 'VIEWER'
  });

  return {
    user: toPublicUser(user),
    token: createToken(user)
  };
};

const login = async ({ email, password }) => {
  if (
    typeof email !== 'string'
    || typeof password !== 'string'
    || email.trim().length === 0
    || password.length === 0
  ) {
    throw new AuthServiceError('Email and password are required', 400);
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() })
    .select('+password');
  const passwordMatches = user
    ? await bcrypt.compare(password, user.password)
    : false;

  if (!user || !passwordMatches) {
    throw new AuthServiceError('Invalid email or password', 401);
  }

  return {
    user: toPublicUser(user),
    token: createToken(user)
  };
};

const verifyToken = (token) => {
  const payload = jwt.verify(token, getJwtSecret(), { issuer: 'tms-api' });
  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new jwt.JsonWebTokenError('Invalid token subject');
  }
  return payload.sub;
};

const getUserById = async (userId) => {
  const user = await User.findById(userId);
  return user ? toPublicUser(user) : null;
};

module.exports = {
  AuthServiceError,
  TOKEN_LIFETIME_SECONDS,
  getJwtSecret,
  getUserById,
  login,
  register,
  verifyToken
};
