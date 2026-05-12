const express = require('express');
const { register, login, logout, sendOTP, resetPassword, verifyOTP } = require('../controllers/authController');
const router = express.Router();
const { getCurrentUser, updateProfile, changePassword } = require('../controllers/authController');
const { authenticateStoreOwner, authenticateStoreStaff } = require('../middleware/auth');

// Existing routes...
router.get('/me', authenticateStoreStaff, getCurrentUser);
router.put('/update-profile', authenticateStoreStaff, updateProfile);
router.put('/change-password', authenticateStoreStaff, changePassword);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post("/send-otp", sendOTP);
router.post("/reset-password", resetPassword);
router.post("/verify-otp", verifyOTP);

module.exports = router;
