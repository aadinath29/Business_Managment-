import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Automatically inject Authorization Bearer Token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const savedAuth = localStorage.getItem('kosqu_auth');
    if (savedAuth) {
      try {
        const auth = JSON.parse(savedAuth);
        if (auth && auth.accessToken) {
          config.headers.Authorization = `Bearer ${auth.accessToken}`;
        }
      } catch (err) {
        console.error('apiClient: Error parsing authorization from localStorage', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 token expiry and trigger refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Avoid infinite loop if refresh token call itself fails with 401
    if (error.response?.status === 401 && originalRequest.url.includes('/auth/refresh')) {
      localStorage.removeItem('kosqu_auth');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const savedAuth = localStorage.getItem('kosqu_auth');
      if (savedAuth) {
        try {
          const auth = JSON.parse(savedAuth);
          if (auth && auth.refreshToken) {
            // Request a new access token
            const res = await axios.post(
              `${apiClient.defaults.baseURL}/auth/refresh`, 
              { refreshToken: auth.refreshToken }
            );
            
            if (res.data?.success) {
              const { accessToken, refreshToken } = res.data.data;
              auth.accessToken = accessToken;
              auth.refreshToken = refreshToken;
              localStorage.setItem('kosqu_auth', JSON.stringify(auth));
              
              // Retry failed request with new access token
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return apiClient(originalRequest);
            }
          }
        } catch (refreshError) {
          console.error('apiClient: Refresh token process failed', refreshError);
        }
      }
      
      // Clear session and redirect to Login
      localStorage.removeItem('kosqu_auth');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
