import React, { useState, useEffect } from 'react';
import './History.css';

// Use relative URL since frontend and backend are served from same server
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001/api'
  : '/api';

function History({ token, userId, viewingUserId, displayName }) {
  const [mealsByDate, setMealsByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingUserId]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const fetchHistory = async () => {
    try {
      const endpoint = viewingUserId 
        ? `${API_URL}/meals/user/${viewingUserId}?limit=365`
        : `${API_URL}/meals?limit=365`;
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Group meals by date
      const grouped = data.reduce((acc, meal) => {
        if (!acc[meal.date]) {
          acc[meal.date] = [];
        }
        acc[meal.date].push(meal);
        return acc;
      }, {});
      
      setMealsByDate(grouped);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDateKey = (year, month, day) => {
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
  };

  const matchesSearch = (meal) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const descriptionMatch = meal.food_description?.toLowerCase().includes(searchLower);
    const drinkMatch = meal.drinks?.some(drink => drink.toLowerCase().includes(searchLower));
    const mealTypeMatch = meal.meal_type?.toLowerCase().includes(searchLower);
    return descriptionMatch || drinkMatch || mealTypeMatch;
  };

  const getMealStats = (dateKey) => {
    const meals = mealsByDate[dateKey] || [];
    const breakfast = meals.some(m => m.meal_type.toLowerCase() === 'breakfast');
    const lunch = meals.some(m => m.meal_type.toLowerCase() === 'lunch');
    const dinner = meals.some(m => m.meal_type.toLowerCase() === 'dinner');
    // Check if any meal has Water in drinks array or had_water flag
    const water = meals.some(m => 
      (m.drinks && m.drinks.includes('Water')) || m.had_water
    );
    
    return { breakfast, lunch, dinner, water, count: meals.length };
  };

  const changeMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
    setSelectedDate(null);
  };

  const handleContextMenu = (e, meal) => {
    e.preventDefault();
    // Only allow delete on own meals
    if (viewingUserId) return;
    
    setSelectedMeal(meal);
    setContextMenu({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleDeleteMeal = async () => {
    if (!selectedMeal) return;

    if (!window.confirm(`Delete this ${selectedMeal.meal_type} entry?`)) {
      setContextMenu(null);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/meals/${selectedMeal.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }

      // Refresh the list
      fetchHistory();
      setContextMenu(null);
    } catch (err) {
      console.error('Error deleting meal:', err);
      alert('Failed to delete meal');
    }
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleMonthInputChange = (e) => {
    const [year, month] = e.target.value.split('-');
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const currentMonthValue = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="history">
      <div className="calendar-header">
        <h2>📅 Meal History {displayName && `- ${displayName}`}</h2>
        
        <div className="month-navigation">
          <button onClick={() => changeMonth(-1)} className="nav-btn">◀</button>
          <input 
            type="month" 
            value={currentMonthValue}
            onChange={handleMonthInputChange}
            className="month-picker-visible"
            aria-label="Select month"
          />
          <button onClick={() => changeMonth(1)} className="nav-btn">▶</button>
        </div>

        <div className="search-bar-history">
          <input
            type="text"
            placeholder="🔍 Search meals by description or drink..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
              }
            }}
            className="search-input-history"
          />
          {searchQuery && (
            <button 
              className="clear-search-btn-history"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="search-hint">
            {(() => {
              const totalMatches = Object.values(mealsByDate).flat().filter(matchesSearch).length;
              const matchingDates = Object.keys(mealsByDate).filter(date => 
                mealsByDate[date].some(matchesSearch)
              ).length;
              return totalMatches > 0 
                ? `Found ${totalMatches} meal${totalMatches !== 1 ? 's' : ''} across ${matchingDates} day${matchingDates !== 1 ? 's' : ''} (highlighted in calendar)`
                : 'No meals found matching your search';
            })()}
          </p>
        )}
      </div>

      <div className="calendar-container">
        <div className="calendar-grid">
          {dayNames.map(day => (
            <div key={day} className="calendar-day-name">{day}</div>
          ))}
          
          {[...Array(startingDayOfWeek)].map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty"></div>
          ))}
          
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const dateKey = formatDateKey(year, month, day);
            const stats = getMealStats(dateKey);
            const isToday = dateKey === new Date().toISOString().split('T')[0];
            const isSelected = selectedDate === dateKey;
            const hasMatchingMeals = searchQuery && mealsByDate[dateKey]?.some(matchesSearch);
            
            return (
              <div 
                key={day} 
                className={`calendar-day ${stats.count > 0 ? 'has-meals' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasMatchingMeals ? 'search-match' : ''}`}
                onClick={() => setSelectedDate(dateKey)}
              >
                <div className="day-number">{day}</div>
                <div className="day-indicators">
                  {stats.breakfast && <span className="meal-dot breakfast" title="Breakfast">🍳</span>}
                  {stats.lunch && <span className="meal-dot lunch" title="Lunch">🍱</span>}
                  {stats.dinner && <span className="meal-dot dinner" title="Dinner">🍽️</span>}
                  {stats.water && <span className="water-dot" title="Water">💧</span>}
                </div>
              </div>
            );
          })}
        </div>

        {selectedDate && mealsByDate[selectedDate] && (
          <div className="selected-day-details">
            <h3>
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            {searchQuery && (
              <p className="search-results-count-history">
                Showing {mealsByDate[selectedDate].filter(matchesSearch).length} of {mealsByDate[selectedDate].length} meals
              </p>
            )}
            <div className="day-meals">
              {(() => {
                const filteredMeals = mealsByDate[selectedDate].filter(matchesSearch);

                if (filteredMeals.length === 0 && searchQuery) {
                  return (
                    <div className="no-search-results">
                      <p>No meals found matching "{searchQuery}"</p>
                    </div>
                  );
                }

                return filteredMeals.map(meal => (
                <div 
                  key={meal.id} 
                  className="meal-detail-card"
                  onContextMenu={(e) => handleContextMenu(e, meal)}
                  onTouchStart={(e) => {
                    const touchTimer = setTimeout(() => {
                      if (!viewingUserId) {
                        handleContextMenu(e, meal);
                      }
                    }, 500);
                    e.currentTarget.touchTimer = touchTimer;
                  }}
                  onTouchEnd={(e) => {
                    if (e.currentTarget.touchTimer) {
                      clearTimeout(e.currentTarget.touchTimer);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.currentTarget.touchTimer) {
                      clearTimeout(e.currentTarget.touchTimer);
                    }
                  }}
                >
                  <div className="meal-header">
                    <span className="meal-type-badge">{meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}</span>
                  </div>
                  <p className="meal-description">
                    {meal.food_description || 'No description'}
                  </p>
                  {((meal.drinks && meal.drinks.length > 0) || meal.had_water) && (
                    <div className="drinks-list">
                      {meal.drinks && meal.drinks.length > 0 ? (
                        meal.drinks.map((drink, idx) => (
                          <span key={idx} className="drink-badge-small">
                            {drink === 'Water' && '💧'}
                            {drink === 'Juice' && '🧃'}
                            {drink === 'Soda' && '🥤'}
                            {drink === 'Coffee' && '☕'}
                            {drink === 'Tea' && '🍵'}
                            {drink === 'Milk' && '🥛'}
                            {drink === 'Energy Drink' && '⚡'}
                            {' '}{drink}
                          </span>
                        ))
                      ) : (
                        meal.had_water && (
                          <span className="drink-badge-small">💧 Water</span>
                        )
                      )}
                    </div>
                  )}
                  <p className="meal-time">
                    ⏰ {new Date(meal.created_at).toLocaleTimeString()}
                  </p>
                </div>
                ));
              })()}
            </div>
          </div>
        )}

        {contextMenu && (
          <div 
            className="context-menu"
            style={{ 
              top: contextMenu.y, 
              left: contextMenu.x 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={handleDeleteMeal} className="context-menu-item delete">
              🗑️ Delete Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
