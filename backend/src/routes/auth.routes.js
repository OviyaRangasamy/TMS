const express = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authentication');

const router = express.Router();

router.post(
  '/register',
  authenticate.optionalAuthenticate,
  authController.register
);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
