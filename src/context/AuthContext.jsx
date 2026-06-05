// src/context/AuthContext.jsx - React Context for global auth management
import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on startup if a token exists
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const u = await api.auth.me();
        setUser(u);
      } catch (err) {
        console.error('[Session Check] Expired or invalid token:', err.message);
        // Clear expired session
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.auth.login(email, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await api.auth.register(name, email, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Force redirect to home / dashboard path
    window.history.pushState({}, '', '/');
    // Dispatch custom popstate event to trigger custom routers
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
