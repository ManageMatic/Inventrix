const express = require('express');
const { register, login, logout } = require('../controllers/authController');
const router = express.Router();
const { getCurrentUser } = require('../controllers/authController');
const { authenticateStoreOwner } = require('../middleware/auth');

// Existing routes...
router.get('/me', authenticateStoreOwner, getCurrentUser);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
