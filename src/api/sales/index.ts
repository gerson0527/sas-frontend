import api from '@/lib/api';

export const salesApi = {
  getAll: async (storeId: string, options?: { startDate?: string; endDate?: string; limit?: number }) => {
    const params = new URLSearchParams({ storeId });
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());
    const res = await api.get(`/sales?${params.toString()}`);
    return res.data;
  },
  
  getById: async (id: string) => {
    const res = await api.get(`/sales/${id}`);
    return res.data;
  },
  
  create: async (data: {
    storeId: string;
    customerId?: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
    paymentMethod: string;
    total: number;
    amountPaid: number;
    change: number;
    status?: 'PAID' | 'PENDING' | 'CANCELLED';
  }) => {
    const res = await api.post('/sales', data);
    return res.data;
  },
  
  cancel: async (id: string, reason?: string) => {
    const res = await api.post(`/sales/${id}/cancel`, { reason });
    return res.data;
  },
  
  getDailySummary: async (storeId: string, date?: string) => {
    const res = await api.get(`/sales/daily-summary?storeId=${storeId}&date=${date || new Date().toISOString().split('T')[0]}`);
    return res.data;
  },
  
  getTopProducts: async (storeId: string, startDate?: string, endDate?: string, limit?: number) => {
    const params = new URLSearchParams({ storeId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());
    const res = await api.get(`/sales/top-products?${params.toString()}`);
    return res.data;
  }
};