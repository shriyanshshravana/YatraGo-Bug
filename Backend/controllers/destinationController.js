const mongoose = require('mongoose');
const Destination = require('../models/Destination');
const { isDbConnected } = require('../config/db');

/**
 * @desc    Get all Indian destinations with search, filtering, sorting and pagination
 * @route   GET /api/destinations
 * @access  Public
 */
const getDestinations = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env.',
      });
    }

    const {
      search,
      state,
      region,
      type,
      minBudget,
      maxBudget,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // Keyword Search across name, state, description, and highlights
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { state: searchRegex },
        { region: searchRegex },
        { description: searchRegex },
        { tag: searchRegex },
        { food: searchRegex },
        { highlights: searchRegex },
      ];
    }

    // Filter by State
    if (state && state.trim() !== '') {
      query.state = new RegExp(`^${state.trim()}$`, 'i');
    }

    // Filter by Region
    if (region && region.trim() !== '' && region.toLowerCase() !== 'all') {
      if (query.$or) {
        query.$or.push({ region: new RegExp(`^${region.trim()}$`, 'i') });
      } else {
        query.region = new RegExp(`^${region.trim()}$`, 'i');
      }
    }

    // Filter by Travel Style / Type
    if (type && type.trim() !== '' && type.toLowerCase() !== 'all' && type.toLowerCase() !== 'all styles') {
      query.type = new RegExp(`^${type.trim()}$`, 'i');
    }

    // Filter by Budget Range
    if (minBudget !== undefined || maxBudget !== undefined) {
      query.budget = {};
      if (minBudget !== undefined && !isNaN(Number(minBudget))) {
        query.budget.$gte = Number(minBudget);
      }
      if (maxBudget !== undefined && !isNaN(Number(maxBudget))) {
        query.budget.$lte = Number(maxBudget);
      }
    }

    // Sorting
    let sortOptions = { name: 1 }; // Default alphabetized
    if (sort === 'budget_asc') {
      sortOptions = { budget: -1 };
    } else if (sort === 'budget_desc') {
      sortOptions = { budget: 1 };
    } else if (sort === 'days_asc') {
      sortOptions = { days: 1 };
    } else if (sort === 'days_desc') {
      sortOptions = { days: -1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [total, destinations] = await Promise.all([
      Destination.countDocuments(query),
      Destination.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.floor(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: destinations.length,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
      data: destinations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single destination by MongoDB ID or slug
 * @route   GET /api/destinations/:id
 * @access  Public
 */
const getDestinationById = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env.',
      });
    }

    const { id } = req.params;
    let destination;

    // Check if parameter is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      destination = await Destination.findById(id);
    }

    // If not found by ObjectId, attempt match by slug (e.g., 'jaipur', 'goa', 'manali')
    if (!destination) {
      destination = await Destination.findOne({
        $or: [{ slug: id.toLowerCase() }, { name: new RegExp(`^${id}$`, 'i') }],
      });
    }

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: `Destination '${id}' was not found in our catalog.`,
      });
    }

    res.status(200).json({
      success: true,
      data: destination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDestinations,
  getDestinationById,
};
