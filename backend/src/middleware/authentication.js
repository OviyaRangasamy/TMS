const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');

const getRequestToken = (req) => {
  const authorization = req.get('authorization');
  if (authorization) {
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : null;
  }
  return req.cookies?.access_token || null;
};

const authenticate = async (req, res, next) => {
  const token = getRequestToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication is required' });
  }

  try {
    const userId = authService.verifyToken(token);
    const user = await authService.getUserById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Authentication is required' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Authentication token is invalid or expired' });
    }
    return next(error);
  }
};

const optionalAuthenticate = (req, res, next) => {
  if (!getRequestToken(req)) {
    return next();
  }
  return authenticate(req, res, next);
};

module.exports = authenticate;
module.exports.optionalAuthenticate = optionalAuthenticate;
