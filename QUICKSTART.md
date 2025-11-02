# Quick Start Guide for "didueat?"

## 🚀 Running the App

### Both servers at once:
```bash
npm run dev
```

### Or separately:

**Terminal 1 (Backend):**
```bash
npm run server
```

**Terminal 2 (Frontend):**
```bash
cd client
npm start
```

Then open http://localhost:3000 in your browser!

## 👥 Setting Up for You and Your Girlfriend

### Step 1: Create Two Accounts

1. Open http://localhost:3000
2. Click "Register"
3. Create an account for your girlfriend:
   - Display Name: (her name)
   - Username: (e.g., "girlfriend" or her name)
   - Password: (her password)
4. After registration, click "Login" at the bottom
5. Logout (button in top right)
6. Click "Register" again
7. Create your account:
   - Display Name: (your name)
   - Username: (e.g., "boyfriend" or your name)
   - Password: (your password)

### Step 2: She Grants You Access

1. Login with her account
2. Click the "Shared with Me" tab
3. In the "Grant Access to Your Dashboard" section
4. Enter YOUR username
5. Click "Grant Access"
6. You'll see "✅ Access granted successfully!"

### Step 3: You Can Now View Her Dashboard

1. Logout and login with your account
2. Click "Shared with Me" tab
3. You'll see her profile card
4. Click "View Dashboard →" to see all her meals!

## 📱 Daily Usage

### For Your Girlfriend:

1. Login to the app
2. Go to "Today's Meals"
3. Fill in the form:
   - Select breakfast/lunch/dinner
   - Describe what she ate
   - Check the water box if she drank water
   - Click "Save Meal"
4. The dashboard will update showing her meals!

### For You:

1. Login to the app
2. Click "Shared with Me"
3. Click on her name
4. See all her meal history including:
   - What she ate for each meal
   - Whether she drank water
   - Timestamps of when she logged it

## 📊 Features You Can Use

- **Today's Meals**: See current day summary and log new meals
- **History**: Browse past meals (up to 90 days)
- **Shared with Me**: 
  - Grant others access to your dashboard
  - View dashboards that others shared with you
  - **NEW!** See a log of everyone you've granted access to
  - **NEW!** Revoke access with one click

## 💡 Tips

- The app automatically saves when you log a meal
- You can update a meal by submitting the form again for the same date/meal type
- Water checkboxes are separate for each meal (breakfast, lunch, dinner)
- All times are automatically recorded when you save
- Data persists even after closing the app

## 🔧 Troubleshooting

**App not loading?**
- Make sure both the backend (port 5001) and frontend (port 3000) are running
- Check the terminal for any error messages

**Can't login?**
- Double-check your username and password
- Remember: usernames are case-sensitive

**Dashboard not showing meals?**
- Make sure you saved the meal (you should see a green success message)
- Try refreshing the page

**Can't see her dashboard?**
- Make sure she granted you access (check the "Grant Access" section)
- Make sure you're viewing from your account, not hers

## 🎯 What You'll See

When you view her dashboard, you'll see:
- **Green gradient cards** for meals she's logged (with smooth animations!)
- **Gray cards** for meals not yet logged
- **💧 icon** when she drank water
- **❌ icon** when she didn't drink water
- **Timestamps** showing when she logged each meal
- **Beautiful hover effects** on all interactive elements

## 🔐 Managing Access

### To Revoke Someone's Access:
1. Login to your account
2. Go to "Shared with Me" tab
3. Look for the "📋 Access Log" section
4. Find the person you want to revoke
5. Click the "🚫 Revoke" button
6. Confirm the action
7. They will no longer see your dashboard!

## 📱 Mobile Features

The app is fully optimized for mobile! Features include:
- **Responsive design** that adapts to any screen size
- **Touch-friendly buttons** (all meet 44px minimum size)
- **Smooth animations** and transitions
- **Sticky navigation** that stays accessible while scrolling
- **No zoom on input** - comfortable typing experience
- **Can be installed** as a PWA on your phone!

### To Install on iPhone:
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. Now you have an app icon! 🎉

### To Install on Android:
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen"
4. Tap "Add"
5. App icon created! 🎉

## ✨ New Visual Features

- **Gradient backgrounds** on buttons and cards
- **Smooth hover effects** with shadows and scaling
- **Fade-in animations** when pages load
- **Slide-in effects** for cards and lists
- **Shimmer effects** on hover
- **Custom purple scrollbars** (on desktop)
- **Success/error messages** with gradient backgrounds
- **Loading indicators** during API calls

Enjoy tracking meals together with style! 🍽️�
