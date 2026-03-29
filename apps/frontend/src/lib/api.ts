import axios from 'axios';
import {
  mockDashboardStats,
  mockTodayTasks,
  mockContacts,
  mockCompanies,
  mockDeals,
  mockTasks,
  mockPipelines,
  mockLeads,
} from './mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Enable mock mode only when explicitly set or when running locally without backend
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Helper to create mock response
const mockResponse = <T>(data: T) => Promise.resolve({ data });

// Helper to wrap API calls with mock fallback
const withMockFallback = <T>(apiCall: () => Promise<{ data: T }>, mockData: T) => {
  if (USE_MOCK) {
    return mockResponse(mockData);
  }
  return apiCall().catch(() => mockResponse(mockData));
};

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
  getDashboardStats: () => withMockFallback(
    () => api.get('/analytics/dashboard'),
    mockDashboardStats
  ),
  getTodayTasks: () => withMockFallback(
    () => api.get('/analytics/today-tasks'),
    mockTodayTasks
  ),
  getSalesAnalytics: (startDate: string, endDate: string) =>
    api.get('/analytics/sales', { params: { startDate, endDate } }),
  getActivityAnalytics: (days?: number) =>
    api.get('/analytics/activity', { params: { days } }),
  getConversionFunnel: () => withMockFallback(
    () => api.get('/analytics/funnel'),
    mockDashboardStats.funnel
  ),
};

// Contacts API
export const contactsApi = {
  getAll: (params?: Record<string, any>) => withMockFallback(
    () => api.get('/contacts', { params }),
    { items: mockContacts, total: mockContacts.length, page: 1, limit: 20 }
  ),
  getById: (id: string) => withMockFallback(
    () => api.get(`/contacts/${id}`),
    mockContacts.find(c => c.id === id) || mockContacts[0]
  ),
  create: (data: any) => api.post('/contacts', data),
  update: (id: string, data: any) => api.patch(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
};

// Deals API
export const dealsApi = {
  getAll: (params?: Record<string, any>) => withMockFallback(
    () => api.get('/deals', { params }),
    { items: mockDeals, total: mockDeals.length, page: 1, limit: 20 }
  ),
  getById: (id: string) => withMockFallback(
    () => api.get(`/deals/${id}`),
    mockDeals.find(d => d.id === id) || mockDeals[0]
  ),
  create: (data: any) => api.post('/deals', data),
  update: (id: string, data: any) => api.patch(`/deals/${id}`, data),
  delete: (id: string) => api.delete(`/deals/${id}`),
  move: (id: string, stageId: string) => api.patch(`/deals/${id}/move`, { stageId }),
};

// Tasks API
export const tasksApi = {
  getAll: (params?: Record<string, any>) => withMockFallback(
    () => api.get('/tasks', { params }),
    { items: mockTasks, total: mockTasks.length, page: 1, limit: 20 }
  ),
  getById: (id: string) => withMockFallback(
    () => api.get(`/tasks/${id}`),
    mockTasks.find(t => t.id === id) || mockTasks[0]
  ),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  complete: (id: string) => api.patch(`/tasks/${id}/complete`),
};

// Companies API
export const companiesApi = {
  getAll: (params?: Record<string, any>) => withMockFallback(
    () => api.get('/companies', { params }),
    { items: mockCompanies, total: mockCompanies.length, page: 1, limit: 20 }
  ),
  getById: (id: string) => withMockFallback(
    () => api.get(`/companies/${id}`),
    mockCompanies.find(c => c.id === id) || mockCompanies[0]
  ),
  create: (data: any) => api.post('/companies', data),
  update: (id: string, data: any) => api.patch(`/companies/${id}`, data),
  delete: (id: string) => api.delete(`/companies/${id}`),
};

// Pipelines API
export const pipelinesApi = {
  getAll: () => withMockFallback(
    () => api.get('/pipelines'),
    mockPipelines
  ),
  getById: (id: string) => withMockFallback(
    () => api.get(`/pipelines/${id}`),
    mockPipelines.find(p => p.id === id) || mockPipelines[0]
  ),
  create: (data: any) => api.post('/pipelines', data),
  update: (id: string, data: any) => api.patch(`/pipelines/${id}`, data),
  delete: (id: string) => api.delete(`/pipelines/${id}`),
};

// Leads API
export const leadsApi = {
  getAll: (params?: Record<string, any>) => withMockFallback(
    () => api.get('/leads', { params }),
    { items: mockLeads, total: mockLeads.length, page: 1, limit: 20 }
  ),
  getById: (id: string) => withMockFallback(
    () => api.get(`/leads/${id}`),
    mockLeads.find(l => l.id === id) || mockLeads[0]
  ),
  create: (data: any) => api.post('/leads', data),
  update: (id: string, data: any) => api.patch(`/leads/${id}`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
  convert: (id: string, data: any) => api.post(`/leads/${id}/convert`, data),
};

export default api;
