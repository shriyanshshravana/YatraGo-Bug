const cloudinary = require('cloudinary').v2;

/**
 * Checks whether all required Cloudinary environment variables are set.
 * Returns true only if CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and
 * CLOUDINARY_API_SECRET are defined and non-empty.
 */
const isCloudinaryConfigured = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return Boolean(
    CLOUDINARY_CLOUD_NAME &&
    CLOUDINARY_API_KEY &&
    CLOUDINARY_API_SECRET &&
    !CLOUDINARY_CLOUD_NAME.includes('your_') &&
    !CLOUDINARY_API_KEY.includes('your_') &&
    !CLOUDINARY_API_SECRET.includes('your_')
  );
};

// Configure Cloudinary once using official Node.js SDK
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true,
  });
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
};
