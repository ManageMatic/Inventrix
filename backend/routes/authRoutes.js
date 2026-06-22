const express = require('express');
const { register, login, logout, sendOTP, sendCustomerOTP, resetPassword, verifyOTP, verifyCustomerOTP } = require('../controllers/authController');
const router = express.Router();
const { getCurrentUser, updateProfile, changePassword } = require('../controllers/authController');
const { authenticateStoreOwner, authenticateStoreStaff, authenticate } = require('../middleware/auth');

// Existing routes...
router.get('/me', authenticate, getCurrentUser);
router.put('/update-profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post("/send-otp", sendOTP);                        // Reset Password OTP (staff/owner/supplier)
router.post("/send-customer-otp", sendCustomerOTP);       // Customer Portal OTP
router.post("/reset-password", resetPassword);
router.post("/verify-otp", verifyOTP);                    // Reset Password OTP verify
router.post("/verify-customer-otp", verifyCustomerOTP);   // Customer Portal OTP verify

module.exports = router;
