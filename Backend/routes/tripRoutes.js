const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');
const {
  createTripValidator,
  updateTripValidator,
  createTaskValidator,
  updateTaskValidator,
  createExpenseValidator,
  createItineraryValidator,
} = require('../utils/validators');

// All trip routes require authentication
router.use(protect);

// Core Trip Endpoints
router.route('/')
  .post(createTripValidator, createTrip)
  .get(getUserTrips);

router.post('/:id/duplicate', duplicateTrip);

router.route('/:id')
  .get(getTripById)
  .put(updateTripValidator, updateTrip)
  .delete(deleteTrip);

// Workspace: Tasks / To-Do items
router.post('/:id/tasks', createTaskValidator, addTask);
router.put('/:id/tasks/:taskId', updateTaskValidator, updateTask);
router.delete('/:id/tasks/:taskId', deleteTask);

// Workspace: Expenses & Budget
router.post('/:id/expenses', createExpenseValidator, addExpense);
router.delete('/:id/expenses/:expenseId', deleteExpense);

// Workspace: Itinerary Activities
router.post('/:id/itinerary', createItineraryValidator, addItineraryActivity);
router.put('/:id/itinerary/activities/:activityId', updateItineraryActivity);
router.delete('/:id/itinerary/activities/:activityId', deleteItineraryActivity);

module.exports = router;
