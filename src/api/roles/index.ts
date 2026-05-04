import api from '@/lib/api';

export const rolesApi = {
  getAll: async (storeId: string) => {
    const res = await api.get(`/roles?storeId=${storeId}`);
    return res.data;
  },
  
  getById: async (id: string, storeId: string) => {
    const res = await api.get(`/roles/${id}?storeId=${storeId}`);
    return res.data;
  },
  
  create: async (data: {
    name: string;
    description?: string;
    storeId?: string;
    permissions: string[];
  }) => {
    const res = await api.post('/roles', data);
    return res.data;
  },
  
  update: async (id: string, data: {
    name?: string;
    description?: string;
    permissions?: string[];
    storeId?: string;
  }) => {
    const storeId = data.storeId ? `?storeId=${data.storeId}` : '';
    const { storeId: _storeId, ...payload } = data;
    const res = await api.put(`/roles/${id}${storeId}`, payload);
    return res.data;
  },
  
  delete: async (id: string, storeId: string) => {
    const res = await api.delete(`/roles/${id}?storeId=${storeId}`);
    return res.data;
  },
  
  getPermissions: async () => {
    const res = await api.get('/roles/permissions');
    return res.data;
  }
};