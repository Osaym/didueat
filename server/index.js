require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from the React app build folder
app.use(express.static(path.join(__dirname, '../client/build')));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !password || !displayName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if username already exists
    const existing = await db.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.createUser(username, hashedPassword, displayName);

    // Make first user an admin automatically
    const allUsers = await db.getAllUsers();
    if (allUsers.length === 1) {
      user.is_admin = true;
      await db.saveDatabase();
      console.log(`First user ${user.username} promoted to admin`);
    }

    await db.addLog('info', 'user_registered', user._id, user.username, { displayName });

    res.status(201).json({
      message: 'User created successfully',
      userId: user._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await db.getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      await db.addLog('security', 'login_failed', user._id, user.username, { reason: 'Invalid password' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, isAdmin: user.is_admin || false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await db.addLog('info', 'login_success', user._id, user.username);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.display_name,
        darkMode: user.dark_mode || false,
        profilePicture: user.profile_picture,
        isAdmin: user.is_admin || false,
        profileColor: user.profile_color || '#667eea'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add or update meal entry
app.post('/api/meals', authenticateToken, async (req, res) => {
  try {
    const { date, mealType, foodDescription, hadWater, drinks } = req.body;
    const userId = req.user.id;

    if (!date || !mealType) {
      return res.status(400).json({ error: 'Date and meal type are required' });
    }

    // Support both old hadWater boolean and new drinks array
    const drinksData = drinks || (hadWater ? ['Water'] : []);

    // Check if entry exists for this user, date, and meal type
    const existing = await db.getMealEntry(userId, date, mealType);

    if (existing) {
      // Update existing entry
      const updated = await db.updateMealEntry(existing._id, foodDescription, drinksData);
      res.json({ message: 'Meal updated successfully', id: updated._id });
    } else {
      // Insert new entry
      const meal = await db.createMealEntry(userId, date, mealType, foodDescription, drinksData);
      res.status(201).json({ message: 'Meal added successfully', id: meal._id });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get meal entries for a specific date
app.get('/api/meals/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.id;

    const meals = await db.getMealsByDate(userId, date);

    // Always return an array, even if empty
    res.json(Array.isArray(meals) ? meals : []);
  } catch (error) {
    console.error(error);
    res.status(500).json([]);  // Return empty array on error instead of error object
  }
});

// Get meal history for a user (last 30 days)
app.get('/api/meals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 30;

    const meals = await db.getMealsByUser(userId, limit);

    res.json(meals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Grant access to another user
app.post('/api/share-access', authenticateToken, async (req, res) => {
  try {
    const { viewerUsername } = req.body;
    const ownerId = req.user.id;

    const viewer = await db.getUserByUsername(viewerUsername);

    if (!viewer) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.createSharedAccess(ownerId, viewer._id);

    await db.addLog('info', 'access_granted', ownerId, req.user.username, {
      grantedTo: viewer.username,
      grantedToId: viewer._id
    });

    res.json({ message: 'Access granted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get list of users who have shared access with you
app.get('/api/shared-with-me', authenticateToken, async (req, res) => {
  try {
    const viewerId = req.user.id;
    const users = await db.getSharedWithUser(viewerId);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get list of users you've granted access to
app.get('/api/shared-by-me', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const users = await db.getSharedByUser(ownerId);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Revoke access from a user
app.delete('/api/share-access/:username', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const viewerUsername = req.params.username;

    const viewer = await db.getUserByUsername(viewerUsername);

    if (!viewer) {
      return res.status(404).json({ error: 'User not found' });
    }

    const revoked = await db.revokeSharedAccess(ownerId, viewer._id);

    if (revoked) {
      await db.addLog('info', 'access_revoked', ownerId, req.user.username, {
        revokedFrom: viewer.username,
        revokedFromId: viewer._id
      });
      res.json({ message: 'Access revoked successfully' });
    } else {
      res.status(404).json({ error: 'Access not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get meal entries for a user you have access to
app.get('/api/meals/user/:userId', authenticateToken, async (req, res) => {
  try {
    const viewerId = req.user.id;
    const targetUserId = req.params.userId;

    // Check if viewer has access
    const hasAccess = await db.getSharedAccess(targetUserId, viewerId);

    if (!hasAccess && viewerId !== targetUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const limit = parseInt(req.query.limit) || 30;
    const meals = await db.getMealsByUser(targetUserId, limit);

    res.json(meals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete meal entry
app.delete('/api/meals/:mealId', authenticateToken, async (req, res) => {
  try {
    const mealId = req.params.mealId;
    const userId = req.user.id;

    const deleted = await db.deleteMealEntry(mealId, userId);

    if (deleted) {
      res.json({ message: 'Meal deleted successfully' });
    } else {
      res.status(404).json({ error: 'Meal not found or unauthorized' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user dark mode preference
app.patch('/api/user/dark-mode', authenticateToken, async (req, res) => {
  try {
    const { darkMode } = req.body;
    const userId = req.user.id;

    const user = await db.updateUserDarkMode(userId, darkMode);

    if (user) {
      res.json({ message: 'Dark mode updated', darkMode: user.dark_mode });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile picture
app.patch('/api/user/profile-picture', authenticateToken, async (req, res) => {
  try {
    const { profilePicture } = req.body;
    const userId = req.user.id;

    const user = await db.updateUserProfilePicture(userId, profilePicture);

    if (user) {
      res.json({ message: 'Profile picture updated', profilePicture: user.profile_picture });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update display name
app.patch('/api/user/display-name', authenticateToken, async (req, res) => {
  try {
    const { displayName } = req.body;
    const userId = req.user.id;

    if (!displayName || displayName.trim().length === 0) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const user = await db.updateUserDisplayName(userId, displayName.trim());

    if (user) {
      res.json({ 
        message: 'Display name updated', 
        displayName: user.display_name 
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile color
app.patch('/api/user/profile-color', authenticateToken, async (req, res) => {
  try {
    const { profileColor } = req.body;
    const userId = req.user.id;

    const user = await db.updateUserProfileColor(userId, profileColor);

    if (user) {
      res.json({ message: 'Profile color updated' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
app.patch('/api/user/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords are required' });
    }

    // Get user's current password
    const hashedPassword = await db.verifyPassword(userId);
    if (!hashedPassword) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, hashedPassword);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await db.updateUserPassword(userId, newHashedPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify security answers (for reset)
app.post('/api/user/verify-security-answers', authenticateToken, async (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.user.id;

    const verified = await db.verifySecurityAnswers(userId, answers);

    res.json({ verified });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set security questions
app.post('/api/user/security-questions', authenticateToken, async (req, res) => {
  try {
    const { questions } = req.body;
    const userId = req.user.id;

    if (!questions || !Array.isArray(questions) || questions.length < 2) {
      return res.status(400).json({ error: 'At least 2 security questions required' });
    }

    await db.setSecurityQuestions(userId, questions);
    res.json({ message: 'Security questions set successfully' });
  } catch (error) {
    console.error('[SECURITY QUESTIONS] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get security questions for password reset (public)
app.get('/api/user/security-questions/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await db.getUserByUsername(username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const questions = await db.getSecurityQuestions(user._id);

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No security questions set' });
    }

    res.json({ questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password with security questions
app.post('/api/user/reset-password', async (req, res) => {
  try {
    const { username, answers, newPassword } = req.body;

    const user = await db.getUserByUsername(username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const verified = await db.verifySecurityAnswers(user._id, answers);

    if (!verified) {
      return res.status(401).json({ error: 'Security answers incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.updateUserPassword(user._id, hashedPassword);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const questions = await db.getSecurityQuestions(user._id);
    const hasSecurityQuestions = questions.length > 0;

    res.json({
      id: user._id,
      username: user.username,
      displayName: user.display_name,
      darkMode: user.dark_mode || false,
      profilePicture: user.profile_picture,
      profileColor: user.profile_color || '#667eea',
      hasSecurityQuestions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete account
app.delete('/api/user/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const success = await db.deleteUser(userId);

    if (success) {
      res.json({ message: 'Account deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('[DELETE ACCOUNT] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Admin: Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get analytics
app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const analytics = await db.getAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get security answers
app.get('/api/admin/security-answers/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const securityQuestions = await db.getSecurityQuestions(userId);
    res.json({ securityQuestions });
  } catch (error) {
    console.error('Error fetching security answers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Reset user password
app.post('/api/admin/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const allUsers = await db.getAllUsers();
    const targetUser = allUsers.find(u => u.id.toString() === userId.toString());
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.updateUserPassword(userId, hashedPassword);
    
    await db.addLog('security', 'password_reset_by_admin', userId, targetUser?.username || 'unknown', {
      adminUser: req.user.username,
      adminId: req.user.id
    });
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Delete user
app.delete('/api/admin/delete-user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const allUsers = await db.getAllUsers();
    const targetUser = allUsers.find(u => u.id.toString() === userId.toString());
    const success = await db.deleteUser(userId);
    if (success) {
      await db.addLog('warning', 'user_deleted_by_admin', userId, targetUser?.username || 'unknown', {
        adminUser: req.user.username,
        adminId: req.user.id
      });
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get logs
app.get('/api/admin/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const logs = await db.getLogs();
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve React app for any other routes (must be after all API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
