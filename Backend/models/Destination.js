const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Destination name is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      index: true,
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      enum: ['North India', 'South India', 'West India', 'East India', 'Central India', 'North East India'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Travel type/style is required'],
      trim: true,
      index: true,
    },
    days: {
      type: Number,
      default: 3,
      min: [1, 'Trip duration must be at least 1 day'],
    },
    budget: {
      type: Number,
      required: [true, 'Estimated budget per person is required'],
      min: [0, 'Budget cannot be negative'],
      index: true,
    },
    tag: {
      type: String,
      default: '',
    },
    emoji: {
      type: String,
      default: '📍',
    },
    image: {
      type: String,
      default: '/images/default-destination.jpg',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    highlights: {
      type: [String],
      default: [],
    },
    bestTime: {
      type: String,
      default: 'October–March',
    },
    food: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
destinationSchema.index({
  name: 'text',
  state: 'text',
  description: 'text',
  tag: 'text',
  food: 'text',
});

module.exports = mongoose.model('Destination', destinationSchema);
