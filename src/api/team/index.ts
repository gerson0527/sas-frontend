import api from '@/lib/api';

export const teamApi = {
  getAll: async (storeId: string) => {
    const res = await api.get(`/team?storeId=${storeId}`);
    return res.data;
  },
  
  getById: async (id: string) => {
    const res = await api.get(`/team/${id}`);
    return res.data;
  },
  
  create: async (data: {
    name: string;
    email: string;
    password: string;
    storeId: string;
    roleId?: string;
  }) => {
    const res = await api.post('/team', data);
    return res.data;
  },
  
  update: async (id: string, data: {
    name?: string;
    email?: string;
    roleId?: string;
    isActive?: boolean;
  }) => {
    const res = await api.put(`/team/${id}`, data);
    return res.data;
  },
  
  delete: async (id: string) => {
    const res = await api.delete(`/team/${id}`);
    return res.data;
  },
  
  resetPassword: async (id: string, newPassword: string) => {
    const res = await api.post(`/team/${id}/reset-password`, { newPassword });
    return res.data;
  }
};