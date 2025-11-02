const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

// Initialize database structure
let db = {
  users: [],
  sharedAccess: [],
  mealEntries: [],
  securityQuestions: [],
  logs: [],
  nextUserId: 1,
  nextAccessId: 1,
  nextMealId: 1,
  nextSecurityId: 1,
  nextLogId: 1
};

// Load existing data
if (fs.existsSync(DB_PATH)) {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const loadedDb = JSON.parse(data);
    
    // Merge with default structure to ensure all fields exist
    db = {
      users: loadedDb.users || [],
      sharedAccess: loadedDb.sharedAccess || [],
      mealEntries: loadedDb.mealEntries || [],
      securityQuestions: loadedDb.securityQuestions || [],
      logs: loadedDb.logs || [],
      nextUserId: loadedDb.nextUserId || 1,
      nextAccessId: loadedDb.nextAccessId || 1,
      nextMealId: loadedDb.nextMealId || 1,
      nextSecurityId: loadedDb.nextSecurityId || 1,
      nextLogId: loadedDb.nextLogId || 1
    };
    
    // Migrate old meal entries to include drinks field
    db.mealEntries = db.mealEntries.map(meal => {
      if (!meal.drinks) {
        return {
          ...meal,
          drinks: meal.had_water ? ['Water'] : []
        };
      }
      return meal;
    });
    
    console.log('Database loaded from file');
  } catch (err) {
    console.error('Error loading database, starting fresh:', err);
  }
} else {
  saveDb();
  console.log('New database initialized');
}

function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Database operations
const database = {
  // User operations
  createUser: (username, password, displayName) => {
    const user = {
      id: db.nextUserId++,
      username,
      password,
      display_name: displayName,
      dark_mode: false,
      profile_picture: null,
      created_at: new Date().toISOString()
    };
    db.users.push(user);
    saveDb();
    return user;
  },

  getUserByUsername: (username) => {
    return db.users.find(u => u.username === username);
  },

  getUserById: (id) => {
    return db.users.find(u => u.id === id);
  },

  updateUserDarkMode: (userId, darkMode) => {
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.dark_mode = darkMode;
      saveDb();
    }
    return user;
  },

  updateUserProfilePicture: (userId, profilePicture) => {
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.profile_picture = profilePicture;
      saveDb();
    }
    return user;
  },

  updateUserProfileColor: (userId, profileColor) => {
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.profile_color = profileColor;
      saveDb();
    }
    return user;
  },

  updateUserDisplayName: (userId, displayName) => {
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.display_name = displayName;
      saveDb();
    }
    return user;
  },

  updateUserPassword: (userId, newPassword) => {
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.password = newPassword;
      saveDb();
    }
    return user;
  },

  // Shared access operations
  createSharedAccess: (ownerId, viewerId) => {
    const existing = db.sharedAccess.find(
      sa => sa.owner_id === ownerId && sa.viewer_id === viewerId
    );
    
    if (existing) return existing;

    const access = {
      id: db.nextAccessId++,
      owner_id: ownerId,
      viewer_id: viewerId,
      created_at: new Date().toISOString()
    };
    db.sharedAccess.push(access);
    saveDb();
    return access;
  },

  getSharedAccess: (ownerId, viewerId) => {
    return db.sharedAccess.find(
      sa => sa.owner_id === ownerId && sa.viewer_id === viewerId
    );
  },

  getSharedWithUser: (viewerId) => {
    const accessRecords = db.sharedAccess.filter(sa => sa.viewer_id === viewerId);
    return accessRecords.map(sa => {
      const user = db.users.find(u => u.id === sa.owner_id);
      return user ? { ...user, access_id: sa.id, granted_at: sa.created_at } : null;
    }).filter(Boolean);
  },

  getSharedByUser: (ownerId) => {
    const accessRecords = db.sharedAccess.filter(sa => sa.owner_id === ownerId);
    return accessRecords.map(sa => {
      const user = db.users.find(u => u.id === sa.viewer_id);
      return user ? { ...user, access_id: sa.id, granted_at: sa.created_at } : null;
    }).filter(Boolean);
  },

  revokeSharedAccess: (ownerId, viewerId) => {
    const index = db.sharedAccess.findIndex(
      sa => sa.owner_id === ownerId && sa.viewer_id === viewerId
    );
    if (index !== -1) {
      db.sharedAccess.splice(index, 1);
      saveDb();
      return true;
    }
    return false;
  },

  // Meal entry operations
  createMealEntry: (userId, date, mealType, foodDescription, drinks) => {
    const meal = {
      id: db.nextMealId++,
      user_id: userId,
      date,
      meal_type: mealType,
      food_description: foodDescription || '',
      drinks: Array.isArray(drinks) ? drinks : [],
      had_water: Array.isArray(drinks) ? (drinks.includes('Water') ? 1 : 0) : 0, // Keep for backwards compatibility
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.mealEntries.push(meal);
    saveDb();
    return meal;
  },

  updateMealEntry: (id, foodDescription, drinks) => {
    const meal = db.mealEntries.find(m => m.id === id);
    if (meal) {
      meal.food_description = foodDescription || '';
      meal.drinks = Array.isArray(drinks) ? drinks : [];
      meal.had_water = Array.isArray(drinks) ? (drinks.includes('Water') ? 1 : 0) : 0; // Keep for backwards compatibility
      meal.updated_at = new Date().toISOString();
      saveDb();
    }
    return meal;
  },

  getMealEntry: (userId, date, mealType) => {
    return db.mealEntries.find(
      m => m.user_id === userId && m.date === date && m.meal_type === mealType
    );
  },

  getMealsByDate: (userId, date) => {
    return db.mealEntries.filter(
      m => m.user_id === userId && m.date === date
    ).sort((a, b) => {
      const order = { breakfast: 0, lunch: 1, dinner: 2, Breakfast: 0, Lunch: 1, Dinner: 2 };
      return (order[a.meal_type] || 0) - (order[b.meal_type] || 0);
    });
  },

  getMealsByUser: (userId, limit = 30) => {
    return db.mealEntries
      .filter(m => m.user_id === userId)
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        const order = { breakfast: 0, lunch: 1, dinner: 2 };
        return order[a.meal_type] - order[b.meal_type];
      })
      .slice(0, limit);
  },

  deleteMealEntry: (mealId, userId) => {
    const index = db.mealEntries.findIndex(m => m.id === mealId && m.user_id === userId);
    if (index !== -1) {
      db.mealEntries.splice(index, 1);
      saveDb();
      return true;
    }
    return false;
  },

  // Security questions operations
  setSecurityQuestions: (userId, questions) => {
    // Remove existing questions for this user
    db.securityQuestions = db.securityQuestions.filter(sq => sq.user_id !== userId);
    
    // Add new questions
    questions.forEach(q => {
      db.securityQuestions.push({
        id: db.nextSecurityId++,
        user_id: userId,
        question: q.question,
        answer: q.answer.toLowerCase().trim(),
        created_at: new Date().toISOString()
      });
    });
    saveDb();
  },

  getSecurityQuestions: (userId) => {
    return db.securityQuestions
      .filter(sq => sq.user_id === userId)
      .map(sq => ({ question: sq.question, id: sq.id }));
  },

  verifySecurityAnswers: (userId, answers) => {
    const userQuestions = db.securityQuestions.filter(sq => sq.user_id === userId);
    
    if (userQuestions.length === 0) return false;
    
    return userQuestions.every(sq => {
      const providedAnswer = answers[sq.id];
      return providedAnswer && providedAnswer.toLowerCase().trim() === sq.answer;
    });
  },

  verifyPassword: (userId, password) => {
    const user = db.users.find(u => u.id === userId);
    return user ? user.password : null;
  },

  deleteUser: (userId) => {
    // Remove user
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;
    
    db.users.splice(userIndex, 1);
    
    // Remove all shared access records (both as owner and viewer)
    db.sharedAccess = db.sharedAccess.filter(
      sa => sa.owner_id !== userId && sa.viewer_id !== userId
    );
    
    // Remove all meal entries
    db.mealEntries = db.mealEntries.filter(
      me => me.user_id !== userId
    );
    
    // Remove all security questions
    db.securityQuestions = db.securityQuestions.filter(
      sq => sq.user_id !== userId
    );
    
    saveDb();
    return true;
  },

  // Admin functions
  getAllUsers: () => {
    return db.users.map(u => ({
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      created_at: u.created_at,
      isAdmin: u.is_admin || false,
      dark_mode: u.dark_mode
    }));
  },

  getAnalytics: () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const totalUsers = db.users.length;
    const totalMeals = db.mealEntries.length;
    const todayMeals = db.mealEntries.filter(m => m.date === today).length;
    const weekMeals = db.mealEntries.filter(m => m.date >= weekAgo).length;
    const sharedAccess = db.sharedAccess.length;

    const breakfastCount = db.mealEntries.filter(m => m.meal_type.toLowerCase() === 'breakfast').length;
    const lunchCount = db.mealEntries.filter(m => m.meal_type.toLowerCase() === 'lunch').length;
    const dinnerCount = db.mealEntries.filter(m => m.meal_type.toLowerCase() === 'dinner').length;

    const waterCount = db.mealEntries.filter(m => 
      (m.drinks && m.drinks.includes('Water')) || m.had_water
    ).length;
    const coffeeCount = db.mealEntries.filter(m => 
      m.drinks && m.drinks.includes('Coffee')
    ).length;
    const juiceCount = db.mealEntries.filter(m => 
      m.drinks && m.drinks.includes('Juice')
    ).length;

    // Calculate active users (users who logged meals today)
    const activeToday = new Set(
      db.mealEntries.filter(m => m.date === today).map(m => m.user_id)
    ).size;

    // Calculate active users in the past week
    const activeWeek = new Set(
      db.mealEntries.filter(m => m.date >= weekAgo).map(m => m.user_id)
    ).size;

    return {
      totalUsers,
      totalMeals,
      todayMeals,
      weekMeals,
      sharedAccess,
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

  updateUserPassword: (userId, hashedPassword) => {
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.password = hashedPassword;
      saveDb();
      return true;
    }
    return false;
  },

  addLog: (level, action, userId, username, details = null) => {
    const log = {
      id: db.nextLogId++,
      timestamp: new Date().toISOString(),
      level, // 'info', 'warning', 'error', 'security'
      action, // e.g., 'login', 'logout', 'meal_created', 'password_reset'
      userId,
      username,
      details
    };
    db.logs.push(log);
    
    // Keep only last 500 logs to prevent bloat
    if (db.logs.length > 500) {
      db.logs = db.logs.slice(-500);
    }
    
    saveDb();
    return log;
  },

  getLogs: (limit = 100) => {
    // Return logs in reverse chronological order
    return db.logs.slice(-limit).reverse();
  }
};

console.log('Database initialized successfully');

module.exports = database;
