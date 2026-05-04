import api from '@/lib/api';

export const suppliersApi = {
  getAll: async (storeId: string) => {
    const res = await api.get(`/suppliers?storeId=${storeId}`);
    return res.data;
  },
  
  getById: async (id: string) => {
    const res = await api.get(`/suppliers/${id}`);
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
  }) => {
    const res = await api.post('/suppliers', data);
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
  }>) => {
    const res = await api.put(`/suppliers/${id}`, data);
    return res.data;
  },
  
  delete: async (id: string) => {
    const res = await api.delete(`/suppliers/${id}`);
    return res.data;
  }
};