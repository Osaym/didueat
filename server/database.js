const mongoose = require('mongoose');
const { User, SharedAccess, MealEntry, SecurityQuestion, Log } = require('./models');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/didueat';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    console.error('Make sure MongoDB is running or MONGODB_URI is set correctly');
    process.exit(1);
  });

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Database operations
const database = {
  // User operations
  createUser: async (username, password, displayName) => {
    const user = new User({
      username,
      password,
      display_name: displayName,
      dark_mode: false,
      profile_picture: null
    });
    await user.save();
    return user;
  },

  getUserByUsername: async (username) => {
    return await User.findOne({ username });
  },

  getUserById: async (id) => {
    return await User.findById(id);
  },

  updateUserDarkMode: async (userId, darkMode) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { dark_mode: darkMode },
      { new: true }
    );
    return user;
  },

  updateUserProfilePicture: async (userId, profilePicture) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { profile_picture: profilePicture },
      { new: true }
    );
    return user;
  },

  updateUserProfileColor: async (userId, profileColor) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { profile_color: profileColor },
      { new: true }
    );
    return user;
  },

  updateUserDisplayName: async (userId, displayName) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { display_name: displayName },
      { new: true }
    );
    return user;
  },

  updateUserPassword: async (userId, newPassword) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { password: newPassword },
      { new: true }
    );
    return user;
  },

  // Shared access operations
  createSharedAccess: async (ownerId, viewerId) => {
    try {
      const existing = await SharedAccess.findOne({
        owner_id: ownerId,
        viewer_id: viewerId
      });
      
      if (existing) return existing;

      const access = new SharedAccess({
        owner_id: ownerId,
        viewer_id: viewerId
      });
      await access.save();
      return access;
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error, return existing
        return await SharedAccess.findOne({
          owner_id: ownerId,
          viewer_id: viewerId
        });
      }
      throw error;
    }
  },

  getSharedAccess: async (ownerId, viewerId) => {
    return await SharedAccess.findOne({
      owner_id: ownerId,
      viewer_id: viewerId
    });
  },

  getSharedWithUser: async (viewerId) => {
    const accessRecords = await SharedAccess.find({ viewer_id: viewerId }).populate('owner_id');
    return accessRecords.map(sa => {
      if (!sa.owner_id) return null;
      return {
        ...sa.owner_id.toObject(),
        id: sa.owner_id._id,
        access_id: sa._id,
        granted_at: sa.created_at
      };
    }).filter(Boolean);
  },

  getSharedByUser: async (ownerId) => {
    const accessRecords = await SharedAccess.find({ owner_id: ownerId }).populate('viewer_id');
    return accessRecords.map(sa => {
      if (!sa.viewer_id) return null;
      return {
        ...sa.viewer_id.toObject(),
        id: sa.viewer_id._id,
        access_id: sa._id,
        granted_at: sa.created_at
      };
    }).filter(Boolean);
  },

  revokeSharedAccess: async (ownerId, viewerId) => {
    const result = await SharedAccess.deleteOne({
      owner_id: ownerId,
      viewer_id: viewerId
    });
    return result.deletedCount > 0;
  },

  // Meal entry operations
  createMealEntry: async (userId, date, mealType, foodDescription, drinks) => {
    const meal = new MealEntry({
      user_id: userId,
      date,
      meal_type: mealType,
      food_description: foodDescription || '',
      drinks: Array.isArray(drinks) ? drinks : [],
      had_water: Array.isArray(drinks) ? (drinks.includes('Water') ? 1 : 0) : 0
    });
    await meal.save();
    return meal;
  },

  updateMealEntry: async (id, foodDescription, drinks) => {
    const meal = await MealEntry.findByIdAndUpdate(
      id,
      {
        food_description: foodDescription || '',
        drinks: Array.isArray(drinks) ? drinks : [],
        had_water: Array.isArray(drinks) ? (drinks.includes('Water') ? 1 : 0) : 0,
        updated_at: new Date()
      },
      { new: true }
    );
    return meal;
  },

  getMealEntry: async (userId, date, mealType) => {
    return await MealEntry.findOne({
      user_id: userId,
      date,
      meal_type: mealType
    });
  },

  getMealsByDate: async (userId, date) => {
    const meals = await MealEntry.find({
      user_id: userId,
      date
    });
    
    meals.sort((a, b) => {
      const order = { breakfast: 0, lunch: 1, dinner: 2, Breakfast: 0, Lunch: 1, Dinner: 2 };
      return (order[a.meal_type] || 0) - (order[b.meal_type] || 0);
    });
    
    return meals;
  },

  getMealsByUser: async (userId, limit = 30) => {
    const meals = await MealEntry.find({ user_id: userId })
      .sort({ date: -1, meal_type: 1 })
      .limit(limit);
    
    return meals;
  },

  deleteMealEntry: async (mealId, userId) => {
    const result = await MealEntry.deleteOne({
      _id: mealId,
      user_id: userId
    });
    return result.deletedCount > 0;
  },

  // Security questions operations
  setSecurityQuestions: async (userId, questions) => {
    // Remove existing questions for this user
    await SecurityQuestion.deleteMany({ user_id: userId });
    
    // Add new questions
    const securityQuestions = questions.map(q => ({
      user_id: userId,
      question: q.question,
      answer: q.answer.toLowerCase().trim()
    }));
    
    await SecurityQuestion.insertMany(securityQuestions);
  },

  getSecurityQuestions: async (userId) => {
    const questions = await SecurityQuestion.find({ user_id: userId });
    return questions.map(sq => ({ question: sq.question, id: sq._id }));
  },

  verifySecurityAnswers: async (userId, answers) => {
    const userQuestions = await SecurityQuestion.find({ user_id: userId });
    
    if (userQuestions.length === 0) return false;
    
    return userQuestions.every(sq => {
      const providedAnswer = answers[sq._id.toString()];
      return providedAnswer && providedAnswer.toLowerCase().trim() === sq.answer;
    });
  },

  verifyPassword: async (userId, password) => {
    const user = await User.findById(userId);
    return user ? user.password : null;
  },

  deleteUser: async (userId) => {
    // Remove user
    const user = await User.findByIdAndDelete(userId);
    if (!user) return false;
    
    // Remove all shared access records (both as owner and viewer)
    await SharedAccess.deleteMany({
      $or: [{ owner_id: userId }, { viewer_id: userId }]
    });
    
    // Remove all meal entries
    await MealEntry.deleteMany({ user_id: userId });
    
    // Remove all security questions
    await SecurityQuestion.deleteMany({ user_id: userId });
    
    return true;
  },

  // Admin functions
  getAllUsers: async () => {
    const users = await User.find({});
    return users.map(u => ({
      id: u._id,
      username: u.username,
      display_name: u.display_name,
      created_at: u.created_at,
      isAdmin: u.is_admin || false,
      dark_mode: u.dark_mode
    }));
  },

  getAnalytics: async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const totalUsers = await User.countDocuments();
    const totalMeals = await MealEntry.countDocuments();
    const todayMeals = await MealEntry.countDocuments({ date: today });
    const weekMeals = await MealEntry.countDocuments({ date: { $gte: weekAgo } });
    const sharedAccessCount = await SharedAccess.countDocuments();

    const breakfastCount = await MealEntry.countDocuments({ 
      meal_type: { $in: ['breakfast', 'Breakfast'] } 
    });
    const lunchCount = await MealEntry.countDocuments({ 
      meal_type: { $in: ['lunch', 'Lunch'] } 
    });
    const dinnerCount = await MealEntry.countDocuments({ 
      meal_type: { $in: ['dinner', 'Dinner'] } 
    });

    const waterCount = await MealEntry.countDocuments({ drinks: 'Water' });
    const coffeeCount = await MealEntry.countDocuments({ drinks: 'Coffee' });
    const juiceCount = await MealEntry.countDocuments({ drinks: 'Juice' });

    // Calculate active users (users who logged meals today)
    const todayMealsDistinct = await MealEntry.distinct('user_id', { date: today });
    const activeToday = todayMealsDistinct.length;

    // Calculate active users in the past week
    const weekMealsDistinct = await MealEntry.distinct('user_id', { date: { $gte: weekAgo } });
    const activeWeek = weekMealsDistinct.length;

    return {
      totalUsers,
      totalMeals,
      todayMeals,
      weekMeals,
      sharedAccess: sharedAccessCount,
      avgMealsPerUser: totalUsers > 0 ? totalMeals / totalUsers : 0,
      breakfastCount,
      lunchCount,
      dinnerCount,
      waterCount,
      coffeeCount,
      juiceCount,
      otherDrinksCount: 0,
      activeToday,
      activeWeek
    };
  },

  updateUserPassword: async (userId, hashedPassword) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );
    return !!user;
  },

  addLog: async (level, action, userId, username, details = null) => {
    const log = new Log({
      level,
      action,
      userId,
      username,
      details
    });
    await log.save();
    
    // Keep only last 500 logs to prevent bloat
    const logCount = await Log.countDocuments();
    if (logCount > 500) {
      const oldestLogs = await Log.find().sort({ timestamp: 1 }).limit(logCount - 500);
      const oldestIds = oldestLogs.map(l => l._id);
      await Log.deleteMany({ _id: { $in: oldestIds } });
    }
    
    return log;
  },

  getLogs: async (limit = 100) => {
    // Return logs in reverse chronological order
    return await Log.find().sort({ timestamp: -1 }).limit(limit);
  },

  // Helper function to save database (for compatibility)
  saveDatabase: () => {
    // No-op for MongoDB (auto-saves)
    return Promise.resolve();
  }
};

console.log('Database module loaded successfully');

module.exports = database;
