import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001/api'
  : `http://${window.location.hostname}:5001/api`;

// Helper function to get today's date in YYYY-MM-DD format using LOCAL time
const getTodayLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function Dashboard({ token }) {
  const [todaysMeals, setTodaysMeals] = useState([]);
  // Always get fresh date using LOCAL timezone
  const today = getTodayLocal();

  useEffect(() => {
    fetchTodaysMeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTodaysMeals = async () => {
    try {
      const response = await fetch(`${API_URL}/meals/${today}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setTodaysMeals(data);
      } else {
        console.error('Expected array but got:', data);
        setTodaysMeals([]);
      }
    } catch (err) {
      console.error('Error fetching meals:', err);
      setTodaysMeals([]);
    }
  };

  const getMealData = (mealType) => {
    // Handle both lowercase and capitalized meal types
    return todaysMeals.find(m => 
      m.meal_type.toLowerCase() === mealType.toLowerCase()
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Not entered yet';
    return new Date(timestamp).toLocaleString();
  };

  const mealTypes = ['breakfast', 'lunch', 'dinner'];

  // Format date for display using local date parts
  const displayDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="dashboard">
      <h2>Today:<br />{displayDate()}</h2>
      <div className="meal-cards">
        {mealTypes.map(mealType => {
          const meal = getMealData(mealType);
          return (
            <div key={mealType} className={`meal-card ${meal ? 'completed' : 'pending'}`}>
              <h3>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h3>
              {meal ? (
                <>
                  <p className="food-desc">{meal.food_description || 'No description'}</p>
                  <div className="drinks-status">
                    {meal.drinks && meal.drinks.length > 0 ? (
                      <>
                        <strong>Drinks</strong>
                        <div className="drinks-badges-container">
                          {meal.drinks.map((drink, idx) => (
                            <span key={idx} className="drink-badge">
                              {drink === 'Water' && '💧'}
                              {drink === 'Juice' && '🧃'}
                              {drink === 'Soda' && '🥤'}
                              {drink === 'Coffee' && '☕'}
                              {drink === 'Tea' && '🍵'}
                              {drink === 'Milk' && '🥛'}
                              {drink === 'Energy Drink' && '⚡'}
                              {' '}{drink}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <span>No drinks recorded</span>
                    )}
                  </div>
                  <p className="timestamp">Updated: {formatTime(meal.updated_at)}</p>
                </>
              ) : (
                <p className="not-entered">Not entered yet</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
