import useSWR from "swr";
import { contactsApi, dealsApi, pipelinesApi, leadsApi, companiesApi } from "./api";

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
