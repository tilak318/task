import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Determine the correct base URL based on platform
const getBaseURL = () => {
  if (__DEV__) {
    // Development environment
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2, physical device needs actual IP
      return 'https://akdm-tasks.onrender.com/api';
    } else if (Platform.OS === 'ios') {
      // iOS simulator uses localhost
      return 'https://akdm-tasks.onrender.com/api';
    }
  }
  
  // Production - use the deployed server URL
  return 'https://akdm-tasks.onrender.com/api';
};



// Create axios instance
export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // Increased timeout for production
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error in request interceptor:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Log error details for debugging
    if (__DEV__) {
      console.log('API Error Details:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }

    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('token');
      } catch (storageError) {
        console.error('Error clearing token:', storageError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Test production server connection
export const testProductionConnection = async () => {
  try {
    console.log('🌐 Testing production server connection...');
    const response = await fetch('https://akdm-tasks.onrender.com/api/health');
    const data = await response.json();
    console.log('✅ Production server connection successful:', data);
    return true;
  } catch (error) {
    console.error('❌ Production server connection failed:', error);
    return false;
  }
};