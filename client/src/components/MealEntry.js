import React, { useState } from 'react';
import './MealEntry.css';

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

function MealEntry({ token }) {
  const today = getTodayLocal();
  const [formData, setFormData] = useState({
    date: today,
    mealType: 'breakfast',
    foodDescription: '',
    drinks: [] // Changed from hadWater to drinks array
  });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validate meal description
    if (!formData.foodDescription || formData.foodDescription.trim() === '') {
      setMessage('⚠️ Please enter a meal description');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/meals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save meal');
      }

      setMessage('✅ Meal saved successfully!');
      setFormData({ ...formData, foodDescription: '', drinks: [] });
      
      // Refresh the dashboard
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setMessage('❌ Error: ' + err.message);
    }
  };

  return (
    <div className="meal-entry">
      <h2>Log Your Meal</h2>
      {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Meal:</label>
          <select
            value={formData.mealType}
            onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>

        <div className="form-group">
          <label>What did you eat?</label>
          <textarea
            value={formData.foodDescription}
            onChange={(e) => setFormData({ ...formData, foodDescription: e.target.value })}
            placeholder="Describe your meal..."
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>What did you drink? (Select all that apply)</label>
          <div className="drink-options">
            {['Water', 'Juice', 'Soda', 'Coffee', 'Tea', 'Milk', 'Energy Drink'].map(drink => (
              <label key={drink} className="drink-checkbox">
                <input
                  type="checkbox"
                  checked={formData.drinks.includes(drink)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, drinks: [...formData.drinks, drink] });
                    } else {
                      setFormData({ ...formData, drinks: formData.drinks.filter(d => d !== drink) });
                    }
                  }}
                />
                <span className="drink-label">
                  {drink === 'Water' && '💧'}
                  {drink === 'Juice' && '🧃'}
                  {drink === 'Soda' && '🥤'}
                  {drink === 'Coffee' && '☕'}
                  {drink === 'Tea' && '🍵'}
                  {drink === 'Milk' && '🥛'}
                  {drink === 'Energy Drink' && '⚡'}
                  {' '}{drink}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="submit-btn">Save Meal</button>
      </form>
    </div>
  );
}

export default MealEntry;
