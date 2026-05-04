import api from '@/lib/api';

export const storeApi = {
  create: async (data: { name: string }) => {
    const res = await api.post('/store', data);
    return res.data;
  },

  get: async (storeId: string) => {
    const res = await api.get(`/store/${storeId}`);
    return res.data;
  },
  
  update: async (storeId: string, data: {
    name?: string;
    address?: string;
    phone?: string;
    city?: string;
    department?: string;
    nit?: string;
    legalName?: string;
    regimen?: string;
    ivaResponsibility?: string;
    mayorista?: boolean;
  }) => {
    const res = await api.put(`/store/${storeId}`, data);
    return res.data;
  },
  
  getSettings: async (storeId: string) => {
    const res = await api.get(`/store/${storeId}/settings`);
    return res.data;
  },
  
  updateSettings: async (storeId: string, data: any) => {
    const res = await api.put(`/store/${storeId}/settings`, data);
    return res.data;
  },
  
  getRegisters: async (storeId: string) => {
    const res = await api.get(`/store/${storeId}/registers`);
    return res.data;
  }
};