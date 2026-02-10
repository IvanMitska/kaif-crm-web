import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    }
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const { state } = JSON.parse(authStorage);
          if (state?.refreshToken) {
            const response = await axios.post(`${API_URL}/api/auth/refresh`, {
              refreshToken: state.refreshToken,
            });

            const newAuthState = {
              state: {
                ...state,
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
              },
            };
            localStorage.setItem('auth-storage', JSON.stringify(newAuthState));

            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Analytics API
export const analyticsApi = {
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getTodayTasks: () => api.get('/analytics/today-tasks'),
  getSalesAnalytics: (startDate: string, endDate: string) =>
    api.get('/analytics/sales', { params: { startDate, endDate } }),
  getActivityAnalytics: (days?: number) =>
    api.get('/analytics/activity', { params: { days } }),
  getConversionFunnel: () => api.get('/analytics/funnel'),
};

// Contacts API
export const contactsApi = {
  getAll: (params?: Record<string, any>) => api.get('/contacts', { params }),
  getById: (id: string) => api.get(`/contacts/${id}`),
  create: (data: any) => api.post('/contacts', data),
  update: (id: string, data: any) => api.patch(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
};

// Deals API
export const dealsApi = {
  getAll: (params?: Record<string, any>) => api.get('/deals', { params }),
  getById: (id: string) => api.get(`/deals/${id}`),
  create: (data: any) => api.post('/deals', data),
  update: (id: string, data: any) => api.patch(`/deals/${id}`, data),
  delete: (id: string) => api.delete(`/deals/${id}`),
  move: (id: string, stageId: string) => api.patch(`/deals/${id}/move`, { stageId }),
};

// Tasks API
export const tasksApi = {
  getAll: (params?: Record<string, any>) => api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  complete: (id: string) => api.patch(`/tasks/${id}/complete`),
};

// Companies API
export const companiesApi = {
  getAll: (params?: Record<string, any>) => api.get('/companies', { params }),
  getById: (id: string) => api.get(`/companies/${id}`),
  create: (data: any) => api.post('/companies', data),
  update: (id: string, data: any) => api.patch(`/companies/${id}`, data),
  delete: (id: string) => api.delete(`/companies/${id}`),
};

// Pipelines API
export const pipelinesApi = {
  getAll: () => api.get('/pipelines'),
  getById: (id: string) => api.get(`/pipelines/${id}`),
  create: (data: any) => api.post('/pipelines', data),
  update: (id: string, data: any) => api.patch(`/pipelines/${id}`, data),
  delete: (id: string) => api.delete(`/pipelines/${id}`),
};

export default api;
