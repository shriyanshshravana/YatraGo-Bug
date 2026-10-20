const mongoose = require('mongoose');

// Task/To-do sub-schema
const taskSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Task text is required'],
      trim: true,
      maxlength: [200, 'Task text cannot exceed 200 characters'],
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Expense sub-schema
const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [100, 'Expense title cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [1, 'Expense amount must be greater than zero'],
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Itinerary activity sub-schema
const itineraryActivitySchema = new mongoose.Schema(
  {
    time: {
      type: String,
      default: '',
      trim: true,
    },
    activity: {
      type: String,
      required: [true, 'Activity title or description is required'],
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Itinerary Day sub-schema
const itineraryDaySchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      default: 'Day Plan',
      trim: true,
    },
    activities: [itineraryActivitySchema],
  },
  {
    timestamps: true,
  }
);

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      default: null,
    },
    destinationName: {
      type: String,
      required: [true, 'Destination name is required'],
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    emoji: {
      type: String,
      default: '🧳',
    },
    title: {
      type: String,
      required: [true, 'Trip title is required'],
      trim: true,
      maxlength: [120, 'Trip title cannot exceed 120 characters'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (value) {
          // End date must be on or after start date
          return !this.startDate || value >= this.startDate;
        },
        message: 'End date must be on or after start date',
      },
    },
    travellers: {
      type: Number,
      default: 2,
      min: [1, 'Number of travellers must be at least 1'],
    },
    budget: {
      type: Number,
      required: [true, 'Total trip budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    notes: {
      type: String,
      default: '',
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    tasks: {
      type: [taskSchema],
      default: [
        { text: 'Confirm travel tickets', done: false },
        { text: 'Shortlist places to stay', done: false },
        { text: 'Save important bookings', done: false },
      ],
    },
    expenses: {
      type: [expenseSchema],
      default: [],
    },
    itinerary: {
      type: [itineraryDaySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for total spent
tripSchema.virtual('totalExpenses').get(function () {
  if (!this.expenses || !this.expenses.length) return 0;
  return this.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
});

// Virtual for remaining budget
tripSchema.virtual('remainingBudget').get(function () {
  const budget = Number(this.budget) || 0;
  const spent = this.totalExpenses;
  return budget - spent;
});

// Virtual for task completion summary
tripSchema.virtual('taskStats').get(function () {
  const total = this.tasks ? this.tasks.length : 0;
  const completed = this.tasks ? this.tasks.filter((t) => t.done).length : 0;
  return {
    total,
    completed,
    remaining: total - completed,
  };
});

module.exports = mongoose.model('Trip', tripSchema);
