const multer = require('multer');

// Configure in-memory storage so image buffer can be validated and streamed to Cloudinary
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const error = new Error('Unsupported file type. Only JPEG, PNG, and WebP images are allowed.');
    error.code = 'UNSUPPORTED_FILE_TYPE';
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
  fileFilter,
});

/**
 * Validates the image buffer's magic bytes to ensure the content matches JPEG, PNG, or WebP.
 * Prevents disguised non-image files with fake MIME types or extensions.
 */
const validateMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 12) {
    return false;
  }

  // JPEG magic bytes: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpeg) return true;

  // PNG magic bytes: 89 50 4E 47
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  if (isPng) return true;

  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  const isWebp =
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';
  if (isWebp) return true;

  return false;
};

/**
 * Middleware wrapper that executes multer and performs signature inspection.
 * Accepts either 'image' or 'profilePicture' form fields.
 */
const uploadProfilePictureMiddleware = (req, res, next) => {
  // Use upload.any() to handle any valid form field name ('profilePicture', 'image', 'file', etc.)
  const multerMiddleware = upload.any();

  multerMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Image size exceeds the maximum limit of 5 MB.',
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload validation failed.',
      });
    }

    // Extract the uploaded file from array or object
    let file = null;
    if (Array.isArray(req.files) && req.files.length > 0) {
      file =
        req.files.find((f) => f.fieldname === 'profilePicture') ||
        req.files.find((f) => f.fieldname === 'image') ||
        req.files[0];
    } else if (req.files && typeof req.files === 'object') {
      file =
        (req.files.profilePicture && req.files.profilePicture[0]) ||
        (req.files.image && req.files.image[0]);
    } else if (req.file) {
      file = req.file;
    }

    if (!file || !file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No image file was provided. Please select an image to upload.',
      });
    }

    // Validate binary content magic bytes
    if (!validateMagicBytes(file.buffer)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported or invalid image file content. Only real JPEG, PNG, and WebP images are allowed.',
      });
    }

    // Attach validated file to req.file for downstream controllers
    req.file = file;
    next();
  });
};

module.exports = {
  uploadProfilePictureMiddleware,
  validateMagicBytes,
  MAX_FILE_SIZE,
};
