import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
  getLeadSources: () => api.get('/analytics/lead-sources'),
  getManagerStats: () => api.get('/analytics/managers'),
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

// Leads API
export const leadsApi = {
  getAll: (params?: Record<string, any>) => api.get('/leads', { params }),
  getById: (id: string) => api.get(`/leads/${id}`),
  create: (data: any) => api.post('/leads', data),
  update: (id: string, data: any) => api.patch(`/leads/${id}`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
  convert: (id: string, data: any) => api.post(`/leads/${id}/convert`, data),
};

// Users API
export const usersApi = {
  getAll: (params?: Record<string, any>) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  getMe: () => api.get('/users/me'),
  getStats: (id: string) => api.get(`/users/${id}/stats`),
  getOnline: () => api.get('/users/online'),
  update: (id: string, data: { firstName?: string; lastName?: string; middleName?: string; phone?: string; avatar?: string }) =>
    api.patch(`/users/${id}`, data),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
  toggleActive: (id: string) => api.patch(`/users/${id}/toggle-active`),
  delete: (id: string) => api.delete(`/users/${id}`),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// Invitations API
export const invitationsApi = {
  create: (data: { email: string; role?: string }) => api.post('/invitations', data),
  getAll: (params?: Record<string, any>) => api.get('/invitations', { params }),
  getByToken: (token: string) => api.get(`/invitations/token/${token}`),
  accept: (data: { token: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    api.post('/invitations/accept', data),
  cancel: (id: string) => api.delete(`/invitations/${id}`),
  resend: (id: string) => api.post(`/invitations/${id}/resend`),
};

// Organizations API
export const organizationsApi = {
  getCurrent: () => api.get('/organizations/current'),
  updateCurrent: (data: { name?: string; slug?: string; currency?: string }) => api.patch('/organizations/current', data),
  getMembers: () => api.get('/organizations/current/members'),
  getMember: (memberId: string) => api.get(`/organizations/current/members/${memberId}`),
  updateMemberRole: (memberId: string, role: string) =>
    api.patch(`/organizations/current/members/${memberId}/role`, { role }),
  toggleMemberActive: (memberId: string) =>
    api.patch(`/organizations/current/members/${memberId}/toggle-active`),
  removeMember: (memberId: string) =>
    api.delete(`/organizations/current/members/${memberId}`),
  getMyOrganizations: () => api.get('/organizations/my'),
};

// Booking API
export const bookingApi = {
  // Resources
  getResources: (params?: { type?: string; category?: string; isActive?: boolean }) =>
    api.get('/booking/resources', { params }),
  getResource: (id: string) =>
    api.get(`/booking/resources/${id}`),
  createResource: (data: {
    name: string;
    type?: string;
    category?: string;
    color?: string;
    workingHours?: Record<string, any>;
    breakTime?: Record<string, any>;
    slotDuration?: number;
  }) => api.post('/booking/resources', data),
  updateResource: (id: string, data: Partial<{
    name: string;
    type: string;
    category: string;
    color: string;
    workingHours: Record<string, any>;
    breakTime: Record<string, any>;
    slotDuration: number;
    isActive: boolean;
  }>) => api.patch(`/booking/resources/${id}`, data),
  deleteResource: (id: string) =>
    api.delete(`/booking/resources/${id}`),

  // Services
  getServices: (params?: { isActive?: boolean; resourceId?: string }) =>
    api.get('/booking/services', { params }),
  getService: (id: string) =>
    api.get(`/booking/services/${id}`),
  createService: (data: {
    name: string;
    description?: string;
    duration: number;
    price?: number;
    color?: string;
    resourceIds?: string[];
  }) => api.post('/booking/services', data),
  updateService: (id: string, data: Partial<{
    name: string;
    description: string;
    duration: number;
    price: number;
    color: string;
    isActive: boolean;
    resourceIds: string[];
  }>) => api.patch(`/booking/services/${id}`, data),
  deleteService: (id: string) =>
    api.delete(`/booking/services/${id}`),

  // Bookings
  getBookings: (params?: {
    resourceId?: string;
    serviceId?: string;
    contactId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    skip?: number;
    take?: number;
  }) => api.get('/booking', { params }),
  getBooking: (id: string) =>
    api.get(`/booking/${id}`),
  createBooking: (data: {
    title?: string;
    startTime: string;
    endTime: string;
    resourceId: string;
    serviceId?: string;
    contactId?: string;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    notes?: string;
  }) => api.post('/booking', data),
  updateBooking: (id: string, data: Partial<{
    title: string;
    startTime: string;
    endTime: string;
    resourceId: string;
    serviceId: string;
    notes: string;
  }>) => api.patch(`/booking/${id}`, data),
  deleteBooking: (id: string) =>
    api.delete(`/booking/${id}`),
  confirmBooking: (id: string) =>
    api.patch(`/booking/${id}/confirm`),
  cancelBooking: (id: string, data?: { reason?: string }) =>
    api.patch(`/booking/${id}/cancel`, data),
  completeBooking: (id: string) =>
    api.patch(`/booking/${id}/complete`),
  markNoShow: (id: string) =>
    api.patch(`/booking/${id}/no-show`),

  // Available slots
  getAvailableSlots: (params: {
    resourceId: string;
    date: string;
    serviceId?: string;
  }) => api.get('/booking/slots', { params }),

  // Schedule overview
  getScheduleOverview: (params: {
    resourceIds?: string;
    dateFrom: string;
    dateTo: string;
  }) => api.get('/booking/schedule', { params }),

  // Stats
  getBookingStats: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get('/booking/stats', { params }),

  // Waiting list
  getWaitingList: (params?: { status?: string; resourceId?: string; serviceId?: string }) =>
    api.get('/booking/waiting-list', { params }),
  createWaitingListItem: (data: {
    contactId?: string;
    clientName?: string;
    clientPhone?: string;
    resourceId?: string;
    serviceId?: string;
    preferredDate?: string;
    notes?: string;
  }) => api.post('/booking/waiting-list', data),
  updateWaitingListItem: (id: string, data: Partial<{
    status: string;
    notes: string;
  }>) => api.patch(`/booking/waiting-list/${id}`, data),
  deleteWaitingListItem: (id: string) =>
    api.delete(`/booking/waiting-list/${id}`),
};

// Telegram API
export const telegramApi = {
  // Bots
  getBots: () =>
    api.get('/telegram/bots'),
  getBot: (id: string) =>
    api.get(`/telegram/bots/${id}`),
  createBot: (data: {
    name: string;
    botToken: string;
    welcomeMessage?: string;
    autoCreateContact?: boolean;
  }) => api.post('/telegram/bots', data),
  updateBot: (id: string, data: Partial<{
    name: string;
    botToken: string;
    welcomeMessage: string;
    autoCreateContact: boolean;
    isActive: boolean;
  }>) => api.patch(`/telegram/bots/${id}`, data),
  deleteBot: (id: string) =>
    api.delete(`/telegram/bots/${id}`),

  // Messaging
  sendMessage: (data: {
    contactId: string;
    text: string;
    integrationId?: string;
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  }) => api.post('/telegram/send', data),

  // Chats
  getUnlinkedChats: () =>
    api.get('/telegram/chats/unlinked'),
  linkChat: (data: { telegramChatId: string; contactId: string }) =>
    api.post('/telegram/chats/link', data),
};

// WhatsApp API
export const whatsappApi = {
  getConfig: () => api.get('/whatsapp/config'),
  updateConfig: (data: {
    phoneNumberId?: string;
    businessAccountId?: string;
    accessToken?: string;
    webhookVerifyToken?: string;
    isActive?: boolean;
  }) => api.patch('/whatsapp/config', data),
  sendMessage: (data: {
    contactId: string;
    text: string;
  }) => api.post('/whatsapp/send', data),
  sendTemplate: (data: {
    contactId: string;
    templateName: string;
    languageCode?: string;
    components?: any[];
  }) => api.post('/whatsapp/send-template', data),
  getChats: (params?: { skip?: number; take?: number }) =>
    api.get('/whatsapp/chats', { params }),
};

// Email IMAP API
export const emailImapApi = {
  // Accounts
  getAccounts: () => api.get('/email-imap/accounts'),
  getAccount: (id: string) => api.get(`/email-imap/accounts/${id}`),
  createAccount: (data: {
    name: string;
    email: string;
    password: string;
    imapHost: string;
    imapPort?: number;
    imapSecure?: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    syncFolder?: string;
    autoLinkContacts?: boolean;
  }) => api.post('/email-imap/accounts', data),
  updateAccount: (id: string, data: Partial<{
    name: string;
    displayName: string;
    password: string;
    syncEnabled: boolean;
    syncFolder: string;
    isActive: boolean;
  }>) => api.patch(`/email-imap/accounts/${id}`, data),
  deleteAccount: (id: string) => api.delete(`/email-imap/accounts/${id}`),
  testConnection: (data: {
    email: string;
    password: string;
    imapHost: string;
    imapPort?: number;
    imapSecure?: boolean;
  }) => api.post('/email-imap/accounts/test', data),
  getProviders: () => api.get('/email-imap/providers'),

  // Sync
  syncAccount: (id: string) => api.post(`/email-imap/accounts/${id}/sync`),
  syncAll: () => api.post('/email-imap/sync-all'),

  // Emails
  getEmails: (params?: {
    accountId?: string;
    contactId?: string;
    unreadOnly?: boolean;
    starredOnly?: boolean;
    sentOnly?: boolean;
    search?: string;
    skip?: number;
    take?: number;
  }) => api.get('/email-imap/emails', { params }),
  getEmail: (id: string) => api.get(`/email-imap/emails/${id}`),
  sendEmail: (data: {
    accountId: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    text?: string;
    html?: string;
    replyToMessageId?: string;
    contactId?: string;
  }) => api.post('/email-imap/emails/send', data),
  replyEmail: (data: {
    originalMessageId: string;
    text?: string;
    html?: string;
    replyAll?: boolean;
  }) => api.post('/email-imap/emails/reply', data),
  markEmails: (data: {
    messageIds: string[];
    isRead?: boolean;
    isStarred?: boolean;
    isArchived?: boolean;
  }) => api.patch('/email-imap/emails/mark', data),
  deleteEmails: (data: { messageIds: string[] }) =>
    api.delete('/email-imap/emails', { data }),
  linkEmailToContact: (data: { messageId: string; contactId: string }) =>
    api.post('/email-imap/emails/link', data),

  // Stats
  getStats: () => api.get('/email-imap/stats'),
};

// Webhooks API
export const webhooksApi = {
  getAll: () => api.get('/webhooks'),
  getById: (id: string) => api.get(`/webhooks/${id}`),
  create: (data: {
    name: string;
    description?: string;
    url: string;
    secret?: string;
    events: string[];
    maxRetries?: number;
    retryDelay?: number;
    headers?: Record<string, string>;
  }) => api.post('/webhooks', data),
  update: (id: string, data: Partial<{
    name: string;
    description: string;
    url: string;
    secret: string;
    events: string[];
    status: string;
    maxRetries: number;
    retryDelay: number;
    headers: Record<string, string>;
  }>) => api.patch(`/webhooks/${id}`, data),
  delete: (id: string) => api.delete(`/webhooks/${id}`),
  getSecret: (id: string) => api.get(`/webhooks/${id}/secret`),
  regenerateSecret: (id: string) => api.post(`/webhooks/${id}/regenerate-secret`),
  test: (id: string, data?: { event?: string }) => api.post(`/webhooks/${id}/test`, data),
  getEvents: () => api.get('/webhooks/events'),
  getEventsInfo: () => api.get('/webhooks/events/info'),
  getStats: () => api.get('/webhooks/stats'),
  getDeliveries: (params?: {
    webhookId?: string;
    event?: string;
    successOnly?: boolean;
    failedOnly?: boolean;
    skip?: number;
    take?: number;
  }) => api.get('/webhooks/deliveries/list', { params }),
  getDelivery: (id: string) => api.get(`/webhooks/deliveries/${id}`),
  retryDelivery: (id: string) => api.post(`/webhooks/deliveries/${id}/retry`),
};

// Messages API
export const messagesApi = {
  // Conversations
  getConversations: (params?: { channel?: string; search?: string; unreadOnly?: boolean; skip?: number; take?: number }) =>
    api.get('/messages/conversations', { params }),
  getConversation: (contactId: string) =>
    api.get(`/messages/conversations/${contactId}`),
  markConversationAsRead: (contactId: string) =>
    api.patch(`/messages/conversations/${contactId}/read`),

  // Statistics
  getChannelStats: () =>
    api.get('/messages/stats/channels'),
  getUnreadCount: () =>
    api.get('/messages/stats/unread'),

  // Messages CRUD
  getAll: (params?: { contactId?: string; channel?: string; direction?: string; unreadOnly?: boolean; search?: string; skip?: number; take?: number }) =>
    api.get('/messages', { params }),
  getById: (id: string) =>
    api.get(`/messages/${id}`),
  create: (data: { contactId: string; content: string; channel: string; direction: string; metadata?: Record<string, any> }) =>
    api.post('/messages', data),
  update: (id: string, data: { content?: string; isRead?: boolean }) =>
    api.patch(`/messages/${id}`, data),
  delete: (id: string) =>
    api.delete(`/messages/${id}`),
  markAsRead: (id: string) =>
    api.patch(`/messages/${id}/read`),

  // Send message helper
  send: (data: { contactId: string; content: string; channel: string; metadata?: Record<string, any> }) =>
    api.post('/messages/send', data),
};

// Integrations API (общий для всех интеграций)
export const integrationsApi = {
  getAll: () => api.get('/integrations'),
  getByType: (type: string) => api.get(`/integrations/type/${type}`),
  getById: (id: string) => api.get(`/integrations/${id}`),
  getStatus: () => api.get('/integrations/status'),
  update: (id: string, data: Partial<{
    name: string;
    isActive: boolean;
    settings: Record<string, any>;
  }>) => api.patch(`/integrations/${id}`, data),
  delete: (id: string) => api.delete(`/integrations/${id}`),
};

export default api;
