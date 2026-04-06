import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: string;
  avatar?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  currency?: string;
}

interface OrganizationMembership {
  id: string;
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'OPERATOR';
  organization: Organization;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  organization: Organization | null;
  orgRole: 'OWNER' | 'ADMIN' | 'MANAGER' | 'OPERATOR' | null;
  organizations: OrganizationMembership[];

  login: (email: string, password: string, twoFactorCode?: string) => Promise<any>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setOrganization: (organization: Organization | null) => void;
  updateOrganization: (updates: Partial<Organization>) => void;
  updateUser: (updates: Partial<User>) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      organization: null,
      orgRole: null,
      organizations: [],

      login: async (email, password, twoFactorCode) => {
        set({ isLoading: true });
        try {
          const response = await axios.post(`${API_URL}/api/auth/login`, {
            email,
            password,
            twoFactorCode,
          });

          const data = response.data;

          if (data.requiresTwoFactor) {
            return data;
          }

          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            organization: data.organization || null,
            orgRole: data.orgRole || null,
            organizations: data.organizations || [],
          });

          axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

          return data;
        } catch (error: any) {
          set({ isLoading: false });
          throw error.response?.data || error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await axios.post(`${API_URL}/api/auth/register`, data);
          const result = response.data;

          set({
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            organization: result.organization || null,
            orgRole: result.orgRole || null,
            organizations: result.organizations || [],
          });

          axios.defaults.headers.common['Authorization'] = `Bearer ${result.accessToken}`;
        } catch (error: any) {
          set({ isLoading: false });
          throw error.response?.data || error;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        
        try {
          if (refreshToken) {
            await axios.post(`${API_URL}/api/auth/logout`, {
              refreshToken,
            });
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            organization: null,
            orgRole: null,
            organizations: [],
          });
          delete axios.defaults.headers.common['Authorization'];
        }
      },

      refreshTokens: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const data = response.data;

          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            organization: data.organization || null,
            orgRole: data.orgRole || null,
            organizations: data.organizations || [],
          });

          axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            organization: null,
            orgRole: null,
            organizations: [],
          });
          delete axios.defaults.headers.common['Authorization'];
          throw error;
        }
      },

      switchOrganization: async (organizationId: string) => {
        const { refreshToken } = get();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await axios.post(`${API_URL}/api/auth/switch-organization`, {
            organizationId,
            refreshToken,
          });

          const data = response.data;

          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            organization: data.organization || null,
            orgRole: data.orgRole || null,
          });

          axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        } catch (error) {
          throw error;
        }
      },

      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      },
      setOrganization: (organization) => set({ organization }),
      updateOrganization: (updates) => {
        const { organization } = get();
        if (organization) {
          set({ organization: { ...organization, ...updates } });
        }
      },
      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        organization: state.organization,
        orgRole: state.orgRole,
        organizations: state.organizations,
      }),
    }
  )
);