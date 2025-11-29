import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, verifyAuth } from '../services/api';
import { message } from 'antd';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await verifyAuth();
      setUser({ role: response.data.role });
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (pin) => {
    try {
      const response = await apiLogin(pin);
      setUser({ role: response.data.role });
      message.success('Login successful');
      return true;
    } catch (error) {
      message.error('Invalid PIN');
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setUser(null);
      message.success('Logged out');
    } catch (error) {
      message.error('Logout failed');
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
