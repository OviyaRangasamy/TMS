const authService = require('../services/auth.service');

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: authService.TOKEN_LIFETIME_SECONDS * 1000,
  path: '/api'
});

const handleError = (res, error) => {
  const statusCode = error.statusCode
    || (error.name === 'ValidationError' ? 400 : null)
    || (error.code === 11000 ? 409 : 500);

  if (statusCode >= 500) {
    console.error('Authentication request failed:', error);
  }

  return res.status(statusCode).json({
    message: statusCode >= 500 ? 'Internal server error' : error.message
  });
};

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body || {});
    if (!req.user) {
      res.cookie('access_token', result.token, cookieOptions());
    }
    return res.status(201).json({ data: result.user });
  } catch (error) {
    return handleError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body || {});
    res.cookie('access_token', result.token, cookieOptions());
    return res.status(200).json({ data: result.user });
  } catch (error) {
    return handleError(res, error);
  }
};

const getCurrentUser = async (req, res) =>
  res.status(200).json({ data: req.user });

const logout = (req, res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api'
  });
  return res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  getCurrentUser,
  login,
  logout,
  register
};
