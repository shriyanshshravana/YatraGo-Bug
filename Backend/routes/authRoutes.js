const express = require('express');
const router = express.Router();
const {
  register,
  verifyOtp,
  devVerify,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  resendOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
} = require('../utils/validators');

// Public Authentication Routes
router.post('/register', registerValidator, register);
router.post('/verify-otp', verifyOtpValidator, verifyOtp);
router.post('/dev-verify', devVerify);
router.post('/resend-otp', resendOtpValidator, resendOtp);
router.post('/login', loginValidator, login);
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.post('/reset-password', resetPasswordValidator, resetPassword);

const {
  uploadProfilePicture,
  deleteProfilePicture,
  getProfilePicture,
} = require('../controllers/userController');
const { uploadProfilePictureMiddleware } = require('../middleware/upload');

// Protected User Routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidator, updateProfile);
router.get('/profile-picture', protect, getProfilePicture);
router.post('/profile-picture', protect, uploadProfilePictureMiddleware, uploadProfilePicture);
router.delete('/profile-picture', protect, deleteProfilePicture);
router.post('/logout', protect, logout);

module.exports = router;

