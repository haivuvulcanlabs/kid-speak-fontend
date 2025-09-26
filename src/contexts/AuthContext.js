// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is already logged in
        if (authService.isAuthenticated()) {
          const isValid = await authService.validateToken();
          if (isValid) {
            const userData = authService.getCurrentUser();
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            authService.clearAuthData();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await authService.login(email, password);
      
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await authService.register(userData);
      
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      
      const response = await authService.updateProfile(profileData);
      
      if (response.success) {
        setUser(response.data.user);
        return response;
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Update preferences function
  const updatePreferences = async (preferences) => {
    try {
      setError(null);
      
      const response = await authService.updatePreferences(preferences);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      
      const response = await authService.changePassword(currentPassword, newPassword);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Get user stats
  const getUserStats = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success) {
        return response.data.stats;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return null;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
    changePassword,
    clearError,
    getUserStats,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
