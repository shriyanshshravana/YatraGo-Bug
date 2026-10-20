const express = require('express');
const router = express.Router();
const {
  getDestinationReviews,
  addReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Support GET /api/reviews/destination/:id, GET /api/destinations/:id/reviews, and GET /api/reviews/:id
router.get('/destination/:id', getDestinationReviews);
router.get('/:id/reviews', getDestinationReviews);
router.get('/:id', getDestinationReviews);

// Support POST /api/reviews (with destinationSlug in body), and POST /api/destinations/:id/reviews
router.post('/', protect, addReview);
router.post('/:id/reviews', protect, addReview);
router.post('/:id', protect, addReview);

// Delete review
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
