const express = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/authentication');
const authorizeRoles = require('../middleware/authorization');

const router = express.Router();

router.use(authenticate, authorizeRoles('manage users', 'ADMIN'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id/role', userController.updateUserRole);

module.exports = router;
