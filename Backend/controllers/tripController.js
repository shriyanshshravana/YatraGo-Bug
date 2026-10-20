const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Destination = require('../models/Destination');
const { isDbConnected } = require('../config/db');
const { sendNotification } = require('../utils/notify');

/**
 * Helper to verify trip existence and user ownership
 */
const findUserTrip = async (tripId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    return { error: { status: 400, message: 'Invalid Trip ID format.' } };
  }

  const trip = await Trip.findById(tripId);

  if (!trip) {
    return { error: { status: 404, message: 'Trip not found.' } };
  }

  if (trip.user.toString() !== userId.toString()) {
    return { error: { status: 403, message: 'You do not have permission to view or modify this trip.' } };
  }

  return { trip };
};

/**
 * @desc    Create a new trip for authenticated user
 * @route   POST /api/trips
 * @access  Private
 */
const createTrip = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env.',
      });
    }

    const {
      destination,
      destinationName,
      state,
      emoji,
      title,
      startDate,
      endDate,
      travellers,
      budget,
      notes,
      tasks,
      expenses,
      itinerary,
      coverImage,
      status,
    } = req.body;

    // If destination ID was supplied, verify destination exists
    let destinationDoc = null;
    if (destination && mongoose.Types.ObjectId.isValid(destination)) {
      destinationDoc = await Destination.findById(destination);
    } else if (destinationName) {
      destinationDoc = await Destination.findOne({
        $or: [
          { slug: destinationName.toLowerCase().trim() },
          { name: new RegExp(`^${destinationName.trim()}$`, 'i') },
        ],
      });
    }

    // Disallow past departure dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    if (start < today) {
      return res.status(400).json({
        success: false,
        message: 'Departure date cannot be in the past. Please select today or a future date.',
      });
    }

    // Minimum budget validation
    const travellersCount = Math.max(1, Number(travellers) || 1);
    const estimatedPerPerson = destinationDoc?.budget ? Number(destinationDoc.budget) : 1000;
    const minRequiredBudget = estimatedPerPerson * travellersCount;
    if (Number(budget) < minRequiredBudget) {
      return res.status(400).json({
        success: false,
        message: `Total budget for ${travellersCount} traveller(s) must be at least ₹${minRequiredBudget.toLocaleString('en-IN')}.`,
      });
    }

    const tripData = {
      user: req.user._id,
      destination: destinationDoc ? destinationDoc._id : null,
      destinationName: destinationName ? destinationName.trim() : (destinationDoc?.name || 'Incredible India'),
      state: state ? state.trim() : (destinationDoc?.state || ''),
      emoji: emoji || destinationDoc?.emoji || '🧳',
      coverImage: coverImage || destinationDoc?.image || '',
      status: status || 'upcoming',
      title: title.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      travellers: Number(travellers) || 2,
      budget: Number(budget),
      notes: notes ? notes.trim() : '',
    };

    // If initial custom tasks provided, override default
    if (tasks && Array.isArray(tasks) && tasks.length > 0) {
      tripData.tasks = tasks;
    }

    if (expenses && Array.isArray(expenses)) {
      tripData.expenses = expenses;
    }

    if (itinerary && Array.isArray(itinerary)) {
      tripData.itinerary = itinerary;
    }

    const trip = await Trip.create(tripData);

    // Notify user of new adventure planned
    await sendNotification({
      user: req.user._id,
      title: 'New Trip Planned',
      message: `Your trip "${trip.title}" to ${trip.destinationName} has been saved.`,
      type: 'trip_created',
      link: `/trip/${trip._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Trip created successfully.',
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all trips belonging to authenticated user
 * @route   GET /api/trips
 * @access  Private
 */
const getUserTrips = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env.',
      });
    }

    const trips = await Trip.find({ user: req.user._id })
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single trip by ID (verifies ownership)
 * @route   GET /api/trips/:id
 * @access  Private
 */
const getTripById = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env.',
      });
    }

    const { error, trip } = await findUserTrip(req.params.id, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update trip details
 * @route   PUT /api/trips/:id
 * @access  Private
 */
const updateTrip = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env.',
      });
    }

    const { error, trip } = await findUserTrip(req.params.id, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const {
      title,
      destinationName,
      state,
      emoji,
      startDate,
      endDate,
      travellers,
      budget,
      notes,
      status,
      coverImage,
    } = req.body;

    if (title !== undefined) trip.title = title.trim();
    if (destinationName !== undefined) trip.destinationName = destinationName.trim();
    if (state !== undefined) trip.state = state.trim();
    if (emoji !== undefined) trip.emoji = emoji;
    if (startDate !== undefined) trip.startDate = new Date(startDate);
    if (endDate !== undefined) trip.endDate = new Date(endDate);
    if (travellers !== undefined) trip.travellers = Number(travellers);
    if (budget !== undefined) trip.budget = Number(budget);
    if (notes !== undefined) trip.notes = notes.trim();
    if (status !== undefined) trip.status = status;
    if (coverImage !== undefined) trip.coverImage = coverImage;
    if (Array.isArray(req.body.tasks)) trip.tasks = req.body.tasks;
    if (Array.isArray(req.body.expenses)) trip.expenses = req.body.expenses;
    if (Array.isArray(req.body.itinerary)) trip.itinerary = req.body.itinerary;

    const updatedTrip = await trip.save();

    await sendNotification({
      user: req.user._id,
      title: 'Trip Updated',
      message: `Changes saved for "${updatedTrip.title}".`,
      type: 'trip_updated',
      link: `/trip/${updatedTrip._id}`,
    });

    res.status(200).json({
      success: true,
      message: 'Trip updated successfully.',
      data: updatedTrip,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Duplicate an existing trip
 * @route   POST /api/trips/:id/duplicate
 * @access  Private
 */
const duplicateTrip = async (req, res, next) => {
  try {
    const { error, trip } = await findUserTrip(req.params.id, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const cloned = await Trip.create({
      user: req.user._id,
      destination: trip.destination,
      destinationName: trip.destinationName,
      state: trip.state,
      emoji: trip.emoji,
      coverImage: trip.coverImage,
      title: `${trip.title}`,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travellers: trip.travellers,
      budget: trip.budget,
      notes: trip.notes,
      tasks: trip.tasks ? trip.tasks.map((t) => ({ text: t.text, done: t.done })) : [],
      expenses: [],
      itinerary: trip.itinerary || [],
      status: 'upcoming',
    });

    await sendNotification({
      user: req.user._id,
      title: 'Trip Duplicated',
      message: `Created a copy of your trip: "${cloned.title}".`,
      type: 'trip_created',
      link: `/trip/${cloned._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Trip duplicated successfully.',
      data: cloned,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete trip
 * @route   DELETE /api/trips/:id
 * @access  Private
 */
const deleteTrip = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env.',
      });
    }

    const { error, trip } = await findUserTrip(req.params.id, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    await trip.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// WORKSPACE: Tasks / To-Do Items
// ==========================================

/**
 * @desc    Add to-do item to trip
 * @route   POST /api/trips/:id/tasks
 * @access  Private
 */
const addTask = async (req, res, next) => {
  try {
    const { error, trip } = await findUserTrip(req.params.id, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const { text } = req.body;
    trip.tasks.push({
      text: text.trim(),
      done: false,
    });

    await trip.save();
    const createdTask = trip.tasks[trip.tasks.length - 1];

    res.status(201).json({
      success: true,
      message: 'Task added successfully.',
      task: createdTask,
      taskStats: trip.taskStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update or toggle to-do item
 * @route   PUT /api/trips/:id/tasks/:taskId
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const { error, trip } = await findUserTrip(req.params.id, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const task = trip.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task item not found.',
      });
    }

    const { text, done } = req.body;
    if (text !== undefined) task.text = text.trim();
    if (done !== undefined) task.done = Boolean(done);

    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task,
      taskStats: trip.taskStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete to-do item
 * @route   DELETE /api/trips/:id/tasks/:taskId
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const { error, trip } = await findUserTrip(req.params.id, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const task = trip.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task item not found.',
      });
    }

    task.deleteOne();
    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Task removed successfully.',
      taskStats: trip.taskStats,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// WORKSPACE: Expenses & Budget Calculations
// ==========================================

/**
 * @desc    Add expense to trip and recompute budget metrics
 * @route   POST /api/trips/:id/expenses
 * @access  Private
 */
const addExpense = async (req, res, next) => {
  try {
    const { error, trip } = await findUserTrip(req.params.id, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const { title, amount, category, date } = req.body;
    const parsedAmount = Number(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount must be a number greater than 0.',
      });
    }

    trip.expenses.push({
      title: title.trim(),
      amount: parsedAmount,
      category: category ? category.trim() : 'General',
      date: date ? new Date(date) : new Date(),
    });

    await trip.save();
    const createdExpense = trip.expenses[trip.expenses.length - 1];

    res.status(201).json({
      success: true,
      message: 'Expense added successfully.',
      expense: createdExpense,
      budget: trip.budget,
      totalExpenses: trip.totalExpenses,
      remainingBudget: trip.remainingBudget,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete expense and recompute budget metrics
 * @route   DELETE /api/trips/:id/expenses/:expenseId
 * @access  Private
 */
const deleteExpense = async (req, res, next) => {
  try {
    const { error, trip } = await findUserTrip(req.params.id, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const expense = trip.expenses.id(req.params.expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.',
      });
    }

    expense.deleteOne();
    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Expense removed successfully.',
      budget: trip.budget,
      totalExpenses: trip.totalExpenses,
      remainingBudget: trip.remainingBudget,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// WORKSPACE: Itinerary Activities
// ==========================================

/**
 * @desc    Add an activity to trip itinerary
 * @route   POST /api/trips/:id/itinerary
 * @access  Private
 */
const addItineraryActivity = async (req, res, next) => {
  try {
    const { error, trip } = await findUserTrip(req.params.id, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const { day, dayTitle, activity, time, location } = req.body;
    const dayNumber = parseInt(day, 10);

    // Look for existing day entry
    let dayEntry = trip.itinerary.find((d) => d.day === dayNumber);

    if (!dayEntry) {
      trip.itinerary.push({
        day: dayNumber,
        title: dayTitle ? dayTitle.trim() : `Day ${dayNumber}`,
        activities: [],
      });
      dayEntry = trip.itinerary[trip.itinerary.length - 1];
    }

    dayEntry.activities.push({
      activity: activity.trim(),
      time: time ? time.trim() : '',
      location: location ? location.trim() : '',
      completed: false,
    });

    await trip.save();

    res.status(201).json({
      success: true,
      message: 'Itinerary activity added successfully.',
      itinerary: trip.itinerary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update or complete itinerary activity
 * @route   PUT /api/trips/:id/itinerary/activities/:activityId
 * @access  Private
 */
const updateItineraryActivity = async (req, res, next) => {
  try {
    const { error, trip } = await findUserTrip(req.params.id, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const { activityId } = req.params;
    const { activity, time, location, completed } = req.body;

    let targetActivity = null;
    for (const day of trip.itinerary) {
      const act = day.activities.id(activityId);
      if (act) {
        targetActivity = act;
        break;
      }
    }

    if (!targetActivity) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary activity not found.',
      });
    }

    if (activity !== undefined) targetActivity.activity = activity.trim();
    if (time !== undefined) targetActivity.time = time.trim();
    if (location !== undefined) targetActivity.location = location.trim();
    if (completed !== undefined) targetActivity.completed = Boolean(completed);

    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Itinerary activity updated successfully.',
      activity: targetActivity,
      itinerary: trip.itinerary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete itinerary activity
 * @route   DELETE /api/trips/:id/itinerary/activities/:activityId
 * @access  Private
 */
const deleteItineraryActivity = async (req, res, next) => {
  try {
    const { error, trip } = await findUserTrip(req.params.id, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const { activityId } = req.params;
    let found = false;

    for (const day of trip.itinerary) {
      const act = day.activities.id(activityId);
      if (act) {
        act.deleteOne();
        found = true;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary activity not found.',
      });
    }

    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Itinerary activity deleted successfully.',
      itinerary: trip.itinerary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  addTask,
  updateTask,
  deleteTask,
  addExpense,
  deleteExpense,
  addItineraryActivity,
  updateItineraryActivity,
  deleteItineraryActivity,
  duplicateTrip,
};
