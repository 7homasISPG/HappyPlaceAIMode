// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../api.js'; // Use our new api service
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Will hold { name, email, id }
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect validates the token on initial app load
    const initializeAuth = () => {
      // Check for valid JWT format before decoding
      if (token && token.split('.').length === 3) {
        try {
          const decoded = jwtDecode(token);
          // Check if token is expired
          if (decoded.exp * 1000 > Date.now()) {
            // In a real app, you'd fetch user details from a /api/me endpoint here
            // For now, we'll just set a placeholder
            setUser({ email: 'user@example.com', name: 'User' }); // Placeholder
          } else {
            // Token is expired, clear it
            localStorage.removeItem('authToken');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error("Invalid token:", error);
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, [token]);

  const login = async (credentials) => {
    try {
      const data = await loginUser(credentials.email, credentials.password);
      localStorage.setItem('authToken', data.access_token);
      setToken(data.access_token);
      setUser({ email: credentials.email, name: 'User' }); // Update with real user data if API returns it
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      await registerUser(userData.name, userData.email, userData.password);
      // Auto-login after successful registration
      return await login({ email: userData.email, password: userData.password });
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };
  
  const value = { user, token, isAuthenticated: !!user, isLoading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);