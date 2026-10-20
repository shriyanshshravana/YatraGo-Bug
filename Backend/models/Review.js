const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    destinationSlug: {
      type: String,
      required: [true, 'Destination identifier is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    destinationName: {
      type: String,
      required: [true, 'Destination name is required'],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review author is required'],
      index: true,
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    userAvatar: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required (1 to 5 stars)'],
      min: [1, 'Minimum rating is 1 star'],
      max: [5, 'Maximum rating is 5 stars'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, 'Review title cannot exceed 120 characters'],
      default: '',
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [3, 'Review must be at least 3 characters'],
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per destination
reviewSchema.index({ destinationSlug: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
