import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser, getCurrentUser, User } from '../services/api';
import * as Device from 'expo-device';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const deviceId = await AsyncStorage.getItem('deviceId');
      if (deviceId) {
        const userData = await getCurrentUser(deviceId);
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (name: string) => {
    try {
      // Generate unique deviceId for each login (not tied to device)
      const deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userData = await registerUser(name, deviceId);
      await AsyncStorage.setItem('deviceId', deviceId);
      await AsyncStorage.setItem('userId', userData.id);
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('deviceId');
    await AsyncStorage.removeItem('userId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
