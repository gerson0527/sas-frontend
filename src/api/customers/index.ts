import api from '@/lib/api';

export const customersApi = {
  getAll: async (storeId: string) => {
    const res = await api.get(`/customers?storeId=${storeId}`);
    return res.data;
  },
  
  getById: async (id: string) => {
    const res = await api.get(`/customers/${id}`);
    return res.data;
  },
  
  create: async (data: {
    name: string;
    email?: string;
    phone?: string;
    documentId?: string;
    documentType?: string;
    address?: string;
    city?: string;
    storeId: string;
    creditLimit?: number;
  }) => {
    const res = await api.post('/customers', data);
    return res.data;
  },
  
  update: async (id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    documentId: string;
    documentType: string;
    address: string;
    city: string;
    creditLimit: number;
  }>) => {
    const res = await api.put(`/customers/${id}`, data);
    return res.data;
  },
  
  delete: async (id: string) => {
    const res = await api.delete(`/customers/${id}`);
    return res.data;
  },
  
  getBalance: async (id: string) => {
    const res = await api.get(`/customers/${id}/balance`);
    return res.data;
  },
  
  updateBalance: async (id: string, amount: number, type: 'ADD' | 'SUBTRACT') => {
    const res = await api.post(`/customers/${id}/balance`, { amount, type });
    return res.data;
  },
  
  getPaymentHistory: async (id: string) => {
    const res = await api.get(`/customers/${id}/payments`);
    return res.data;
  }
};