import api from '@/lib/api';

export const purchasesApi = {
  getAll: async (storeId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ storeId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await api.get(`/purchases?${params.toString()}`);
    return res.data;
  },
  
  getById: async (id: string) => {
    const res = await api.get(`/purchases/${id}`);
    return res.data;
  },
  
  create: async (data: {
    storeId: string;
    supplierId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    total: number;
    paymentMethod: string;
    status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  }) => {
    const res = await api.post('/purchases', data);
    return res.data;
  },
  
  update: async (id: string, data: {
    status?: string;
    items?: any[];
    total?: number;
  }) => {
    const res = await api.put(`/purchases/${id}`, data);
    return res.data;
  },
  
  delete: async (id: string) => {
    const res = await api.delete(`/purchases/${id}`);
    return res.data;
  },
  
  receive: async (id: string) => {
    const res = await api.post(`/purchases/${id}/receive`);
    return res.data;
  }
};