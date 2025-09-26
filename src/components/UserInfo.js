// src/components/UserInfo.js
import React, { useState } from 'react';
import './UserInfo.css';

function UserInfo({ onUserInfoSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.age) {
      newErrors.age = 'Please select your age';
    } else {
      const age = parseInt(formData.age);
      if (age < 6 || age > 11) {
        newErrors.age = 'Age must be between 6 and 11';
      }
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onUserInfoSubmit({
        name: formData.name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender
      });
    }
  };

  return (
    <div className="user-info-container">
      <div className="user-info-header">
        <h2>👋 Welcome to KidSpeak!</h2>
        <p>Let's get to know you better before we start learning English together!</p>
      </div>
      
      <form className="user-info-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">
            <span className="label-icon">👤</span>
            What's your name?
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter your name"
            className={errors.name ? 'error' : ''}
            maxLength={20}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="age">
            <span className="label-icon">🎂</span>
            How old are you?
          </label>
          <select
            id="age"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            className={errors.age ? 'error' : ''}
          >
            <option value="">Select your age</option>
            <option value="6">6 years old</option>
            <option value="7">7 years old</option>
            <option value="8">8 years old</option>
            <option value="9">9 years old</option>
            <option value="10">10 years old</option>
            <option value="11">11 years old</option>
          </select>
          {errors.age && <span className="error-message">{errors.age}</span>}
        </div>

        <div className="form-group">
          <label>
            <span className="label-icon">👦👧</span>
            Are you a boy or a girl?
          </label>
          <div className="gender-options">
            <label className="gender-option">
              <input
                type="radio"
                name="gender"
                value="boy"
                checked={formData.gender === 'boy'}
                onChange={handleInputChange}
              />
              <span className="gender-icon">👦</span>
              <span className="gender-text">Boy</span>
            </label>
            <label className="gender-option">
              <input
                type="radio"
                name="gender"
                value="girl"
                checked={formData.gender === 'girl'}
                onChange={handleInputChange}
              />
              <span className="gender-icon">👧</span>
              <span className="gender-text">Girl</span>
            </label>
          </div>
          {errors.gender && <span className="error-message">{errors.gender}</span>}
        </div>

        <button type="submit" className="submit-button">
          <span className="button-icon">🚀</span>
          Start Learning!
        </button>
      </form>
      
      <div className="user-info-footer">
        <p>💡 Don't worry! This information helps me teach you better.</p>
      </div>
    </div>
  );
}

export default UserInfo;
