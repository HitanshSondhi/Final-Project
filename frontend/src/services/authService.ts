import axios from 'axios';

// Base URL for the backend API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie-based authentication
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      try {
        const refreshResponse = await api.post('/users/refresh-token');
        const newToken = refreshResponse.data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        
        // Retry original request
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  isrole: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyEmailData {
  email: string;
  otp: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  isrole: string;
  isverified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  statusCode: number;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  message: string;
  success: boolean;
}

class AuthService {
  // Register new user
  async register(userData: RegisterData): Promise<{ message: string }> {
    try {
      const response = await api.post('/users/register', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  // Verify email with OTP
  async verifyEmail(verifyData: VerifyEmailData): Promise<AuthResponse> {
    try {
      const response = await api.post('/users/verifyUser', verifyData);
      const { user, accessToken, refreshToken } = response.data.data;
      
      // Store tokens and user data
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Email verification failed');
    }
  }

  // Login user
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post('/users/login', loginData);
      const { user, accessToken, refreshToken } = response.data.data;
      
      // Store tokens and user data
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await api.post('/users/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Resend OTP
  async resendOTP(email: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/users/resend-otp', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to resend OTP');
    }
  }
}

export default new AuthService();