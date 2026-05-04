import api from '@/lib/api';

export const dashboardApi = {
  getStats: async (storeId: string) => {
    const res = await api.get(`/dashboard/stats?storeId=${storeId}`);
    return res.data;
  },
  
  getOverview: async (storeId: string) => {
    const res = await api.get(`/dashboard/overview?storeId=${storeId}`);
    return res.data;
  },
  
  getRecentSales: async (storeId: string, limit?: number) => {
    const res = await api.get(`/dashboard/recent-sales?storeId=${storeId}&limit=${limit || 5}`);
    return res.data;
  },
  
  getLowStockAlerts: async (storeId: string) => {
    const res = await api.get(`/dashboard/low-stock?storeId=${storeId}`);
    return res.data;
  },
  
  getTodaySummary: async (storeId: string) => {
    const res = await api.get(`/dashboard/today?storeId=${storeId}`);
    return res.data;
  }
};