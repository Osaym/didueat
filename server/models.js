const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true  // Store all usernames in lowercase
  },
  password: {
    type: String,
    required: true
  },
  display_name: {
    type: String,
    required: true
  },
  dark_mode: {
    type: Boolean,
    default: false
  },
  profile_picture: {
    type: String,
    default: null
  },
  profile_color: {
    type: String,
    default: null
  },
  is_admin: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// SharedAccess Schema
const sharedAccessSchema = new mongoose.Schema({
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Add compound index to ensure unique owner-viewer pairs
sharedAccessSchema.index({ owner_id: 1, viewer_id: 1 }, { unique: true });

// MealEntry Schema
const mealEntrySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  meal_type: {
    type: String,
    required: true,
    enum: ['breakfast', 'lunch', 'dinner', 'Breakfast', 'Lunch', 'Dinner']
  },
  food_description: {
    type: String,
    default: ''
  },
  drinks: {
    type: [String],
    default: []
  },
  had_water: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Add compound index for efficient querying
mealEntrySchema.index({ user_id: 1, date: 1, meal_type: 1 });

// SecurityQuestion Schema
const securityQuestionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Log Schema
const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'security'],
    required: true
  },
  action: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  username: {
    type: String,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
});

// Create models
const User = mongoose.model('User', userSchema);
const SharedAccess = mongoose.model('SharedAccess', sharedAccessSchema);
const MealEntry = mongoose.model('MealEntry', mealEntrySchema);
const SecurityQuestion = mongoose.model('SecurityQuestion', securityQuestionSchema);
const Log = mongoose.model('Log', logSchema);

module.exports = {
  User,
  SharedAccess,
  MealEntry,
  SecurityQuestion,
  Log
};
