// frontend/src/services/auth.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/auth',
  timeout: 10000,
});

// Add token to requests automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.post('/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (username, password, role = 'viewer') => {
  try {
    const response = await apiClient.post('/register', {
      username,
      password,
      role,
    });
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await apiClient.post('/logout');
  } catch (error) {
    console.error('Logout error:', error);
    // Don't throw error on logout failure
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/profile');
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};
