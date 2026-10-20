const Review = require('../models/Review');
const Destination = require('../models/Destination');
const { sendNotification } = require('../utils/notify');
const { isDbConnected } = require('../config/db');

/**
 * @desc    Get all reviews and rating stats for a destination
 * @route   GET /api/destinations/:id/reviews
 * @access  Public
 */
const getDestinationReviews = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    if (!rawId) {
      return res.status(400).json({ success: false, message: 'Destination parameter is required.' });
    }

    const slug = rawId.toLowerCase().trim();

    if (!isDbConnected()) {
      return res.status(200).json({
        success: true,
        data: {
          destinationSlug: slug,
          count: 0,
          averageRating: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          reviews: [],
        },
      });
    }

    const reviews = await Review.find({
      $or: [{ destinationSlug: slug }, { destinationName: new RegExp(`^${slug}$`, 'i') }],
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar profilePicture');

    const count = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = count > 0 ? Math.floor(sum / count) : 0;

    // Calculate rating distribution (5 star down to 1 star)
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.round(r.rating);
      if (distribution[star] !== undefined) {
        distribution[star]++;
      }
    });

    res.status(200).json({
      success: true,
      reviews,
      averageRating,
      totalReviews: count,
      count,
      distribution,
      destinationSlug: slug,
      data: {
        destinationSlug: slug,
        count,
        totalReviews: count,
        averageRating,
        distribution,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit or update a review for a destination
 * @route   POST /api/destinations/:id/reviews
 * @access  Private (protect)
 */
const addReview = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'You must be logged in to leave a review.' });
    }

    const rawId = req.params.id || req.body.destinationSlug || req.body.destination;
    if (!rawId) {
      return res.status(400).json({
        success: false,
        message: 'Destination slug or ID is required.',
      });
    }

    const slug = rawId.toLowerCase().trim();
    const { rating, title, comment, destinationName } = req.body;

    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5.',
      });
    }

    if (!comment || comment.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Review comment must be at least 3 characters.',
      });
    }

    // Determine destination display name
    let destDisplayName = destinationName ? destinationName.trim() : slug;
    const destDoc = await Destination.findOne({ slug });
    if (destDoc) {
      destDisplayName = destDoc.name;
    }

    // Check if user has already reviewed this destination; update if existing
    let review = await Review.findOne({ destinationSlug: slug, user: req.user._id });

    if (review) {
      review.rating = parsedRating;
      review.title = (title || '').trim();
      review.comment = comment.trim();
      review.userName = req.user.name;
      review.userAvatar = req.user.profilePicture || req.user.avatar || '';
      await review.save();
    } else {
      review = await Review.create({
        destinationSlug: slug,
        destinationName: destDisplayName,
        user: req.user._id,
        userName: req.user.name,
        userAvatar: req.user.profilePicture || req.user.avatar || '',
        rating: parsedRating,
        title: (title || '').trim(),
        comment: comment.trim(),
      });
    }

    // Send notification
    await sendNotification({
      user: req.user._id,
      title: 'Review Published',
      message: `Your ${parsedRating}★ review for ${destDisplayName} is now live.`,
      type: 'review_added',
      link: `/destination/${slug}`,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for sharing your experience! Your review is published.',
      review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:reviewId
 * @access  Private (protect)
 */
const deleteReview = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own reviews.' });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDestinationReviews,
  addReview,
  deleteReview,
};
