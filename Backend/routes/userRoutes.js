const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadProfilePictureMiddleware } = require('../middleware/upload');
const {
  uploadProfilePicture,
  deleteProfilePicture,
  getProfilePicture,
} = require('../controllers/userController');
const { getProfile, updateProfile } = require('../controllers/authController');

// Profile Picture Endpoints
router.get('/profile-picture', protect, getProfilePicture);
router.post('/profile-picture', protect, uploadProfilePictureMiddleware, uploadProfilePicture);
router.delete('/profile-picture', protect, deleteProfilePicture);

// Standard User Profile Endpoints (mounted under /api/users)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
