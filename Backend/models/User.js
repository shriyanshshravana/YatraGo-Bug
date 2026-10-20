const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Do not return password by default in queries
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    cloudinaryPublicId: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: 'Traveller exploring India.',
      maxlength: [300, 'Bio cannot exceed 300 characters'],
    },
    phone: {
      type: String,
      default: '',
    },
    homeCity: {
      type: String,
      default: '',
      trim: true,
      maxlength: [80, 'Home city cannot exceed 80 characters'],
    },
    travelInterests: {
      type: [String],
      default: [],
    },
    travelStyle: {
      type: String,
      default: 'Explorer',
      trim: true,
    },
    // Legal policy agreement
    termsAccepted: {
      type: Boolean,
      required: [true, 'Terms and Conditions acceptance is required'],
      default: false,
    },
    termsAcceptedAt: {
      type: Date,
      default: Date.now,
    },
    termsVersion: {
      type: String,
      default: '1.0',
    },
    // Verification OTP details (stored securely as hash, never plain text)
    otp: {
      codeHash: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      lastSentAt: { type: Date, select: false },
      attempts: { type: Number, default: 0, select: false },
    },
    // Password Reset OTP details
    resetOtp: {
      codeHash: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      lastSentAt: { type: Date, select: false },
      attempts: { type: Number, default: 0, select: false },
    },
    // Invalidation token version for secure logout
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.otp;
        delete ret.resetOtp;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before saving if it has been modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
