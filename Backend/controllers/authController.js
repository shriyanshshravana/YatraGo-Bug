const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');
const { isDbConnected } = require('../config/db');
const {
  generateOtp,
  hashOtp,
  compareOtp,
  getOtpExpiryDate,
  checkCooldown,
  isOtpExpired,
  MAX_ATTEMPTS,
} = require('../utils/otp');
const { sendOtpEmail, isEmailConfigured } = require('../utils/mailer');
const { sendNotification } = require('../utils/notify');

/**
 * @desc    Register a new user and generate verification OTP
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env.',
      });
    }

    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please log in.',
        });
      }

      // Unverified account: update credentials and send fresh OTP
      const rawOtp = generateOtp();
      const codeHash = await hashOtp(rawOtp);
      const expiresAt = getOtpExpiryDate();

      existingUser.name = name.trim();
      existingUser.password = password;
      existingUser.otp = {
        codeHash,
        expiresAt,
        lastSentAt: new Date(),
        attempts: 0,
      };
      await existingUser.save();

      const mailResult = await sendOtpEmail(normalizedEmail, rawOtp, 'verification');

      return res.status(200).json({
        success: true,
        message: 'A fresh 6-digit verification code has been sent to your email.',
        emailSent: mailResult.success,
        emailConfigured: mailResult.configured,
        user: {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          isVerified: false,
        },
      });
    }

    // Generate secure 6-digit OTP
    const rawOtp = generateOtp();
    const codeHash = await hashOtp(rawOtp);
    const expiresAt = getOtpExpiryDate();

    // Create user in database (password is automatically hashed via Mongoose pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      isVerified: false,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
      otp: {
        codeHash,
        expiresAt,
        lastSentAt: new Date(),
        attempts: 0,
      },
    });

    // Attempt to send email
    const mailResult = await sendOtpEmail(normalizedEmail, rawOtp, 'verification');

    if (!mailResult.success && mailResult.configured) {
      return res.status(502).json({
        success: false,
        message: `Account created, but verification email could not be delivered (${mailResult.message}). Please check your SMTP settings or spam folder.`,
        emailSent: false,
        emailConfigured: true,
      });
    }

    // Never return the raw OTP in response or log it
    res.status(201).json({
      success: true,
      message: mailResult.configured
        ? 'Account registered successfully. A 6-digit verification code has been sent to your email.'
        : 'Account registered successfully. Real email delivery is not configured on this server (EMAIL_USER / EMAIL_PASS missing). Configure SMTP credentials in .env to receive live emails.',
      emailSent: mailResult.success,
      emailConfigured: mailResult.configured,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email with 6-digit OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env.',
      });
    }

    const { email, otp } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+otp.codeHash +otp.expiresAt +otp.lastSentAt +otp.attempts'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This account is already verified. You can log in directly.',
      });
    }

    if (!user.otp || !user.otp.codeHash) {
      return res.status(400).json({
        success: false,
        message: 'No verification code requested or code has already been used. Please request a new code.',
      });
    }

    // Check maximum attempts
    if (user.otp.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP code.',
      });
    }

    // Check expiration
    if (isOtpExpired(user.otp.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    // Verify OTP using secure constant-time bcrypt compare
    const isMatch = await compareOtp(otp, user.otp.codeHash);

    if (!isMatch) {
      user.otp.attempts = (user.otp.attempts || 0) + 1;
      await user.save();

      const remainingAttempts = MAX_ATTEMPTS - user.otp.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Please request a new code.'}`,
      });
    }

    // Mark user verified and clear OTP (single-use)
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Issue JWT token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to YatraGo.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        avatar: user.avatar,
        profilePicture: user.profilePicture || user.avatar || '',
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Development mode auto-verify helper (active only in development when SMTP is unconfigured)
 * @route   POST /api/auth/dev-verify
 * @access  Public
 */
const devVerify = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production' || isEmailConfigured()) {
      return res.status(403).json({
        success: false,
        message: 'Dev verify is disabled when real email provider is configured or in production.',
      });
    }

    const { email } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = generateToken(user);
    res.status(200).json({
      success: true,
      message: 'Account verified successfully in development mode!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        avatar: user.avatar,
        profilePicture: user.profilePicture || user.avatar || '',
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend verification OTP with rate limiting
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOtp = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env.',
      });
    }

    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+otp.lastSentAt +otp.codeHash'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This account is already verified. Please log in directly.',
      });
    }

    // Check rate limit cooldown (e.g. 60 seconds)
    const cooldown = checkCooldown(user.otp?.lastSentAt);
    if (cooldown.active) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${cooldown.remainingSeconds} second(s) before requesting a new OTP.`,
        retryAfterSeconds: cooldown.remainingSeconds,
      });
    }

    // Generate new secure OTP
    const rawOtp = generateOtp();
    const codeHash = await hashOtp(rawOtp);
    const expiresAt = getOtpExpiryDate();

    user.otp = {
      codeHash,
      expiresAt,
      lastSentAt: new Date(),
      attempts: 0,
    };
    await user.save();

    // Send email
    const mailResult = await sendOtpEmail(normalizedEmail, rawOtp, 'verification');

    if (!mailResult.success && mailResult.configured) {
      return res.status(502).json({
        success: false,
        message: `Could not deliver verification code (${mailResult.message}). Please check your email configuration or spam folder.`,
        emailSent: false,
        emailConfigured: true,
      });
    }

    res.status(200).json({
      success: true,
      message: mailResult.configured
        ? 'A fresh verification code has been sent to your email.'
        : 'A new code was generated. Note: Email delivery is not configured on this server (EMAIL_USER / EMAIL_PASS missing). Configure SMTP in .env to receive live emails.',
      emailSent: mailResult.success,
      emailConfigured: mailResult.configured,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log in with email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env.',
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Find user including password field for comparison
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if email has been verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        isVerified: false,
        email: user.email,
        message: 'Please verify your email address to log in. A 6-digit OTP code was sent to your email.',
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        avatar: user.avatar,
        profilePicture: user.profilePicture || user.avatar || '',
        bio: user.bio,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Initiate forgot password flow (sends reset OTP)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env.',
      });
    }

    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+resetOtp.lastSentAt');

    if (!user) {
      // Return 404 with helpful message
      return res.status(404).json({
        success: false,
        message: 'No account registered with this email address.',
      });
    }

    // Rate-limit check
    const cooldown = checkCooldown(user.resetOtp?.lastSentAt);
    if (cooldown.active) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${cooldown.remainingSeconds} second(s) before requesting another reset code.`,
        retryAfterSeconds: cooldown.remainingSeconds,
      });
    }

    // Generate reset OTP
    const rawOtp = generateOtp();
    const codeHash = await hashOtp(rawOtp);
    const expiresAt = getOtpExpiryDate();

    user.resetOtp = {
      codeHash,
      expiresAt,
      lastSentAt: new Date(),
      attempts: 0,
    };
    await user.save();

    // Send email
    const mailResult = await sendOtpEmail(normalizedEmail, rawOtp, 'reset-password');

    if (!mailResult.success && mailResult.configured) {
      return res.status(502).json({
        success: false,
        message: `Password reset code generated, but email delivery failed (${mailResult.message}). Please check your email configuration or spam folder.`,
        emailSent: false,
        emailConfigured: true,
      });
    }

    res.status(200).json({
      success: true,
      message: mailResult.configured
        ? 'A 6-digit password reset code has been sent to your email.'
        : 'Password reset code generated. Note: Email delivery is not configured on this server (EMAIL_USER / EMAIL_PASS missing). Configure SMTP in .env to receive live emails.',
      emailSent: mailResult.success,
      emailConfigured: mailResult.configured,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using 6-digit OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env.',
      });
    }

    const { email, otp, newPassword } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+resetOtp.codeHash +resetOtp.expiresAt +resetOtp.attempts +password +tokenVersion'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    if (!user.resetOtp || !user.resetOtp.codeHash) {
      return res.status(400).json({
        success: false,
        message: 'No active password reset request. Please initiate forgot-password first.',
      });
    }

    if (user.resetOtp.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Maximum reset attempts exceeded. Please request a new reset code.',
      });
    }

    if (isOtpExpired(user.resetOtp.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new code.',
      });
    }

    const isMatch = await compareOtp(otp, user.resetOtp.codeHash);
    if (!isMatch) {
      user.resetOtp.attempts = (user.resetOtp.attempts || 0) + 1;
      await user.save();
      const remainingAttempts = MAX_ATTEMPTS - user.resetOtp.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid reset code. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Please request a new code.'}`,
      });
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.resetOtp = undefined;
    // Invalidate existing sessions across devices
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current authenticated user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { name, bio, phone, avatar, profilePicture, homeCity, travelInterests, travelStyle } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) {
      user.avatar = avatar.trim();
      user.profilePicture = avatar.trim();
    }
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture.trim();
      user.avatar = profilePicture.trim();
    }
    if (homeCity !== undefined) user.homeCity = homeCity.trim();
    if (travelInterests !== undefined && Array.isArray(travelInterests)) {
      user.travelInterests = travelInterests;
    }
    if (travelStyle !== undefined) user.travelStyle = travelStyle.trim();

    const updatedUser = await user.save();

    await sendNotification({
      user: req.user._id,
      title: 'Profile Updated',
      message: 'Your travel profile details were updated successfully.',
      type: 'profile_updated',
      link: '/profile',
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user and invalidate server-side token
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const user = req.user;

    // Increment tokenVersion to invalidate the current JWT and any other issued tokens
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Token invalidated on server. Please remove token from client storage.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
