const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to evaluate express-validator results
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check the entered data.',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// ==========================================
// Authentication Validators
// ==========================================
const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('termsAccepted')
    .custom((val) => val === true || val === 'true')
    .withMessage('You must agree to the Terms and Conditions and Privacy Policy'),
  validateRequest,
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateRequest,
];

const verifyOtpValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  validateRequest,
];

const resendOtpValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  validateRequest,
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  validateRequest,
];

const resetPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  validateRequest,
];

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Bio cannot exceed 300 characters'),
  body('phone')
    .optional()
    .trim(),
  body('avatar')
    .optional()
    .trim(),
  validateRequest,
];

// ==========================================
// Trip Validators
// ==========================================
const createTripValidator = [
  body('destinationName')
    .trim()
    .notEmpty()
    .withMessage('Destination name is required'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Trip title is required')
    .isLength({ max: 120 })
    .withMessage('Trip title cannot exceed 120 characters'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)')
    .custom((startDate) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const depDate = new Date(startDate);
      depDate.setHours(0, 0, 0, 0);
      if (depDate < today) {
        throw new Error('Departure date cannot be in the past');
      }
      return true;
    }),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)')
    .custom((endDate, { req }) => {
      if (req.body.startDate && new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('Return date must be on or after departure date');
      }
      return true;
    }),
  body('budget')
    .notEmpty()
    .withMessage('Budget is required')
    .isFloat({ min: 100 })
    .withMessage('Budget must be at least ₹100'),
  body('travellers')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Number of travellers must be between 1 and 100'),
  validateRequest,
];

const updateTripValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Trip title cannot exceed 120 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a non-negative number'),
  body('travellers')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Number of travellers must be between 1 and 100'),
  validateRequest,
];

// ==========================================
// Workspace Item Validators
// ==========================================
const createTaskValidator = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Task text is required')
    .isLength({ max: 200 })
    .withMessage('Task text cannot exceed 200 characters'),
  validateRequest,
];

const updateTaskValidator = [
  body('text')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Task text cannot exceed 200 characters'),
  body('done')
    .optional()
    .isBoolean()
    .withMessage('done must be a boolean value'),
  validateRequest,
];

const createExpenseValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Expense title is required')
    .isLength({ max: 100 })
    .withMessage('Expense title cannot exceed 100 characters'),
  body('amount')
    .notEmpty()
    .withMessage('Expense amount is required')
    .isFloat({ min: 1 })
    .withMessage('Expense amount must be greater than zero'),
  body('category')
    .optional()
    .trim(),
  validateRequest,
];

const createItineraryValidator = [
  body('day')
    .notEmpty()
    .withMessage('Day number is required')
    .isInt({ min: 1 })
    .withMessage('Day must be a positive number'),
  body('activity')
    .trim()
    .notEmpty()
    .withMessage('Activity description is required'),
  body('time')
    .optional()
    .trim(),
  body('location')
    .optional()
    .trim(),
  validateRequest,
];

module.exports = {
  validateRequest,
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  resendOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  createTripValidator,
  updateTripValidator,
  createTaskValidator,
  updateTaskValidator,
  createExpenseValidator,
  createItineraryValidator,
};
