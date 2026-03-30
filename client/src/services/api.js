import axios from 'axios';
import { supabase } from './supabase';

// Use environment variable from Create React App (defaults to local dev port if not set)
const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api/v1';

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to inject the Supabase session token
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error fetching Supabase session:', error);
      return config;
    }

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error('API Interceptor Error:', err);
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor for unified error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle global errors here like 401 redirects to login
    if (error.response?.status === 401) {
      console.warn('Unauthorized access detected. Possible session expiration.');
      // Handle session expiry logic if needed
    }
    
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject({ ...error, message });
  }
);

export default api;
