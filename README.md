# 🍽️ didueat? - Meal & Water Tracker

A simple web app to track daily meals and water intake, with the ability to share your dashboard with others.

## Features

- 📝 **Log Daily Meals**: Track breakfast, lunch, and dinner with descriptions
- 💧 **Water Tracking**: Confirm water intake for each meal
- ⏰ **Timestamps**: See when each meal was logged
- 📊 **History View**: Browse past meal entries (up to 90 days)
- 👥 **Shared Access**: Grant dashboard viewing access to others
- 📋 **Access Log**: See who you've shared with and revoke access anytime
- 🚫 **Revoke Access**: Remove viewing permissions with one click
- 🔐 **Secure Authentication**: User registration and login with JWT tokens
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 🎨 **Customizable Profile**: Choose profile colors and avatars
- 🛡️ **Admin Panel**: User management and analytics (for admin users)
- 🔍 **Search History**: Search through all meal records
- 📱 **Touch-friendly Navigation**: Slide across navigation tabs on mobile
- 📱 **Mobile Optimized**: Fully responsive design that works great on phones
- ✨ **Beautiful Animations**: Smooth transitions and interactive UI elements
- 🎨 **Modern Design**: Clean, gradient-based interface with purple theme

## Tech Stack

- **Frontend**: React 19.2.0
- **Backend**: Node.js + Express
- **Database**: JSON file-based storage (no setup required!)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Styling**: Pure CSS with modern gradients and animations

## Setup Instructions

### 1. Install Dependencies

First, install backend dependencies:
```bash
npm install
```

Then, install frontend dependencies:
```bash
cd client
npm install
cd ..
```

Or use the combined command:
```bash
npm run install-all
```

### 2. Configure Environment

The `.env` file is already created. For production use, change the JWT_SECRET to a secure random string:
```
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
```

### 3. Run the Application

Start both the backend and frontend:
```bash
npm run dev
```

Or run them separately:
- Backend only: `npm run server`
- Frontend only: `npm run client`

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## Usage Guide

### First Time Setup

1. **Register an Account**: 
   - Open http://localhost:3000
   - Click "Register" and create an account
   - Create two accounts (one for your friend, one for you)

2. **Log Your Meals**:
   - Login with your friend's account
   - Go to "Today's Meals" tab
   - Use the form to log breakfast, lunch, or dinner
   - Check the water checkbox if water was consumed
   - Click "Save Meal"

3. **Grant Access**:
   - Still logged in as your friend
   - Go to "Shared with Me" tab
   - Enter your username in the "Grant Access" section
   - Click "Grant Access"

4. **View Her Dashboard**:
   - Logout and login with your account
   - Go to "Shared with Me" tab
   - Click on your friend's name
   - View all her meal history!

### Daily Use

Your friend can:
- Log meals throughout the day
- Check off water intake for each meal
- View her history
- See timestamps for when each meal was logged

You can:
- View her dashboard anytime
- See what she ate and if she drank water
- Check timestamps to see when she logged meals

## Database

The app uses a simple JSON file-based storage system, which stores all data in a `data.json` file in the `server` folder. No additional database setup is required! The data persists between server restarts.

## Security Note

This is a simple application for personal use. For production deployment:
- Change the JWT_SECRET to a strong, random value
- Use HTTPS
- Implement rate limiting
- Add email verification
- Use environment-specific configurations

## Project Structure

```
didueat/
├── server/
│   ├── index.js          # Express server and API routes
│   ├── database.js       # Database setup and schema
│   └── didueat.db        # SQLite database (created automatically)
├── client/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.js        # Main app component
│   │   └── App.css       # Global styles
│   └── public/           # Static files
├── package.json          # Backend dependencies
└── .env                  # Environment variables
```

## Troubleshooting

**Port already in use?**
- Change the PORT in `.env` file
- Kill the process using the port

**Can't connect to backend?**
- Make sure both frontend and backend are running
- Check that the backend is running on port 5001
- Verify the API_URL in React components

**Database issues?**
- Delete `server/data.json` to reset the database
- Restart the server to reinitialize the database

## Deployment

### Deploying to Railway (Recommended)

1. Push your code to GitHub
2. Sign up at [railway.app](https://railway.app)
3. Create a new project from your GitHub repo
4. Add environment variables:
   - `JWT_SECRET`: Your secure random string
   - `PORT`: 5001
   - `NODE_ENV`: production
5. Deploy both services (backend and frontend)
6. Connect your custom domain

### Deploying to Render

1. Push your code to GitHub
2. Sign up at [render.com](https://render.com)
3. Create a **Web Service** for the backend
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Create a **Static Site** for the frontend
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/build`
5. Add environment variables to the backend service

### Environment Variables for Production

Create a `.env` file in the `server/` directory:
```
JWT_SECRET=your-super-secure-random-string-at-least-32-characters-long
PORT=5001
NODE_ENV=production
```

**Important**: Never commit your `.env` file to GitHub!

## License

MIT License - See LICENSE file for details

---

Enjoy tracking your meals! 🍽️💧