import useSWR from "swr";
import { contactsApi, dealsApi, pipelinesApi, leadsApi, companiesApi, bookingApi, telegramApi } from "./api";

// SWR config for fast navigation - use fallback data immediately
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 60 seconds
  keepPreviousData: true,
  revalidateOnMount: false, // Don't refetch on mount if we have data
  revalidateIfStale: false, // Don't auto-refetch stale data
};

// Contacts
export function useContacts() {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    "contacts",
    async () => {
      const res = await contactsApi.getAll();
      return res.data.items || res.data || [];
    },
    swrConfig
  );

  return {
    contacts: data || [],
    isLoading: isLoading && !data,
    isError: error,
    mutate: (newData: any, revalidate = false) => mutate(newData, revalidate),
  };
}

// Deals
export function useDeals() {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    "deals",
    async () => {
      const res = await dealsApi.getAll();
      return res.data.items || res.data || [];
    },
    swrConfig
  );

  return {
    deals: data || [],
    isLoading: isLoading && !data,
    isError: error,
    mutate: (newData: any, revalidate = false) => mutate(newData, revalidate),
  };
}

// Pipelines
export function usePipelines() {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    "pipelines",
    async () => {
      const res = await pipelinesApi.getAll();
      const result = (res.data as any).items || res.data || [];
      return Array.isArray(result) ? result : [result];
    },
    swrConfig
  );

  return {
    pipelines: data || [],
    isLoading: isLoading && !data,
    isError: error,
    mutate: (newData: any, revalidate = false) => mutate(newData, revalidate),
  };
}

// Leads
export function useLeads() {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    "leads",
    async () => {
      const res = await leadsApi.getAll();
      return res.data.items || res.data || [];
    },
    swrConfig
  );

  return {
    leads: data || [],
    isLoading: isLoading && !data,
    isError: error,
    mutate: (newData: any, revalidate = false) => mutate(newData, revalidate),
  };
}

// Companies
export function useCompanies() {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    "companies",
    async () => {
      const res = await companiesApi.getAll();
      return res.data.items || res.data || [];
    },
    swrConfig
  );

  return {
    companies: data || [],
    isLoading: isLoading && !data,
    isError: error,
    mutate: (newData: any, revalidate = false) => mutate(newData, revalidate),
  };
}

// Booking Resources
export function useBookingResources(params?: { type?: string; category?: string; isActive?: boolean }) {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    ["booking-resources", params],
    async () => {
      const res = await bookingApi.getResources(params);
      return res.data.items || res.data || [];
    },
    swrConfig
  );

  return {
    resources: data || [],
    isLoading: isLoading && !data,
    isError: error,
    mutate: (newData: any, revalidate = false) => mutate(newData, revalidate),
  };
}

// Booking Services
export function useBookingServices(params?: { isActive?: boolean; resourceId?: string }) {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    ["booking-services", params],
    async () => {
      const res = await bookingApi.getServices(params);
      return res.data.items || res.data || [];
    },
    swrConfig
  );

  return {
    services: data || [],
    isLoading: isLoading && !data,
    isError: error,
    mutate: (newData: any, revalidate = false) => mutate(newData, revalidate),
  };
}

// Bookings
export function useBookings(params?: {
  resourceId?: string;
  serviceId?: string;
  contactId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    ["bookings", params],
    async () => {
      const res = await bookingApi.getBookings(params);
      return res.data.items || res.data || [];
    },
    swrConfig
  );

  return {
    bookings: data || [],
    isLoading: isLoading && !data,
    isError: error,
    mutate: (newData: any, revalidate = false) => mutate(newData, revalidate),
  };
}

// Booking Stats
export function useBookingStats(params?: { dateFrom?: string; dateTo?: string }) {
  const { data, error, isLoading } = useSWR(
    ["booking-stats", params],
    async () => {
      const res = await bookingApi.getBookingStats(params);
      return res.data;
    },
    swrConfig
  );

  return {
    stats: data || { pending: 0, confirmed: 0, completed: 0, cancelled: 0, noShow: 0 },
    isLoading: isLoading && !data,
    isError: error,
  };
}

// Waiting List
export function useWaitingList(params?: { status?: string; resourceId?: string; serviceId?: string }) {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    ["waiting-list", params],
    async () => {
      const res = await bookingApi.getWaitingList(params);
      return res.data.items || res.data || [];
    },
    swrConfig
  );

  return {
    waitingList: data || [],
    isLoading: isLoading && !data,
    isError: error,
    mutate: (newData: any, revalidate = false) => mutate(newData, revalidate),
  };
}

// Telegram Bots
export function useTelegramBots() {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    "telegram-bots",
    async () => {
      const res = await telegramApi.getBots();
      return res.data || [];
    },
    swrConfig
  );

  return {
    bots: data || [],
    isLoading: isLoading && !data,
    isError: error,
    mutate: (newData: any, revalidate = false) => mutate(newData, revalidate),
  };
}

// Telegram Unlinked Chats
export function useTelegramUnlinkedChats() {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    "telegram-unlinked-chats",
    async () => {
      const res = await telegramApi.getUnlinkedChats();
      return res.data || [];
    },
    swrConfig
  );

  return {
    chats: data || [],
    isLoading: isLoading && !data,
    isError: error,
    mutate: (newData: any, revalidate = false) => mutate(newData, revalidate),
  };
}
