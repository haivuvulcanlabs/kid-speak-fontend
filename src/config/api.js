// src/config/api.js
// Configuration for API endpoints based on environment

const getApiBaseUrl = () => {
  // Check if we're in production (deployed on Vercel or other hosting)
  if (process.env.NODE_ENV === 'production') {
    return 'https://kid-speak-backend.vercel.app/api/chat';
  }
  
  // Check if we're running locally
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api/chat';
  }
  
  // Fallback to production URL for other environments
  return 'https://kid-speak-backend.vercel.app/api/chat';
};

export const API_BASE_URL = getApiBaseUrl();

// Log the API URL being used for debugging
console.log('API Base URL:', API_BASE_URL);
