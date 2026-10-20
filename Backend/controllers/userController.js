const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const User = require('../models/User');

/**
 * Helper to upload buffer to Cloudinary via upload_stream
 */
const uploadBufferToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
    stream.end(buffer);
  });
};

/**
 * @desc    Upload or replace user profile picture
 * @route   POST /api/users/profile-picture (and /api/auth/profile-picture)
 * @access  Private (requires protect middleware)
 */
const uploadProfilePicture = async (req, res, next) => {
  try {
    // 1. Identify user strictly from authenticated session token (req.user set by protect middleware)
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in to upload a profile picture.',
      });
    }

    // 2. Validate that file was parsed and validated by upload middleware
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No image file was provided for upload.',
      });
    }

    // 3. Check Cloudinary service configuration
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          'Cloudinary image service is not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the Render dashboard environment.',
      });
    }

    // 4. Stable per-user Cloudinary public ID strategy
    // Using a deterministic public ID (yatrago/profiles/user_<userId>) prevents duplicate orphaned images
    // when a user changes their photo multiple times.
    const publicId = `user_${req.user._id}`;
    const uploadOptions = {
      folder: 'yatrago/profiles',
      public_id: publicId,
      overwrite: true,
      invalidate: true, // Invalidate CDN cache for this public ID
      resource_type: 'image',
      transformation: [
        { width: 600, height: 600, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
    };

    let uploadResult;
    try {
      uploadResult = await uploadBufferToCloudinary(req.file.buffer, uploadOptions);
    } catch (uploadErr) {
      console.error('[Cloudinary Upload Error]', uploadErr.message || 'Upload failed');
      return res.status(502).json({
        success: false,
        message: 'Failed to upload image to cloud storage. Please try again later.',
      });
    }

    if (!uploadResult || !uploadResult.secure_url) {
      return res.status(502).json({
        success: false,
        message: 'Cloud storage did not return a valid secure URL. Please try again.',
      });
    }

    // 5. Update authenticated user document in MongoDB
    // Only update profilePicture, avatar, and cloudinaryPublicId
    const secureUrl = uploadResult.secure_url;
    const finalPublicId = uploadResult.public_id || `yatrago/profiles/${publicId}`;

    let updatedUser;
    try {
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          profilePicture: secureUrl,
          avatar: secureUrl,
          cloudinaryPublicId: finalPublicId,
        },
        { new: true, runValidators: true }
      );
    } catch (dbErr) {
      console.error('[Database Update Error]', dbErr.message);
      // Attempt to clean up orphaned image if DB update failed
      try {
        await cloudinary.uploader.destroy(finalPublicId);
      } catch (cleanupErr) {
        // Suppress cleanup error
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to save profile picture to user profile.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile picture uploaded and saved successfully.',
      profilePicture: updatedUser.profilePicture,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Profile Picture Error]', error.message);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while processing your profile picture.',
    });
  }
};

/**
 * @desc    Remove user profile picture
 * @route   DELETE /api/users/profile-picture (and /api/auth/profile-picture)
 * @access  Private (requires protect middleware)
 */
const deleteProfilePicture = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in to remove your profile picture.',
      });
    }

    const currentPublicId =
      req.user.cloudinaryPublicId || `yatrago/profiles/user_${req.user._id}`;

    // If Cloudinary is configured, remove asset from Cloudinary
    if (isCloudinaryConfigured() && (req.user.profilePicture || req.user.cloudinaryPublicId)) {
      try {
        await cloudinary.uploader.destroy(currentPublicId);
      } catch (cloudErr) {
        console.warn('[Cloudinary Delete Notice]', cloudErr.message);
        // Continue to clear user document even if Cloudinary asset already disappeared
      }
    }

    // Update MongoDB user document to clear profilePicture, avatar, and cloudinaryPublicId
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        profilePicture: '',
        avatar: '',
        cloudinaryPublicId: '',
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully.',
      profilePicture: '',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Delete Profile Picture Error]', error.message);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while removing your profile picture.',
    });
  }
};

/**
 * @desc    Get user profile picture URL
 * @route   GET /api/users/profile-picture
 * @access  Private (requires protect middleware)
 */
const getProfilePicture = async (req, res) => {
  try {
    const profilePicture = req.user.profilePicture || req.user.avatar || '';
    return res.status(200).json({
      success: true,
      profilePicture,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile picture.',
    });
  }
};

module.exports = {
  uploadProfilePicture,
  deleteProfilePicture,
  getProfilePicture,
};
