import api from '@/lib/api';

export const registersApi = {
  getAll: async (storeId: string) => {
    const res = await api.get(`/registers?storeId=${storeId}`);
    return res.data;
  },
  
  getById: async (id: string) => {
    const res = await api.get(`/registers/${id}`);
    return res.data;
  },
  
  create: async (data: {
    name: string;
    storeId: string;
    location?: string;
  }) => {
    const res = await api.post('/registers', data);
    return res.data;
  },
  
  update: async (id: string, data: {
    name?: string;
    location?: string;
    isActive?: boolean;
  }) => {
    const res = await api.put(`/registers/${id}`, data);
    return res.data;
  },
  
  delete: async (id: string) => {
    const res = await api.delete(`/registers/${id}`);
    return res.data;
  },
  
  openShift: async (registerId: string, startingCash: number) => {
    const res = await api.post(`/registers/${registerId}/open`, { startingCash });
    return res.data;
  },
  
  closeShift: async (shiftId: string, data: {
    actualCash: number;
    expectedCash: number;
    difference: number;
    notes?: string;
  }) => {
    const res = await api.post(`/registers/${shiftId}/close`, data);
    return res.data;
  },
  
  getShiftHistory: async (registerId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ registerId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await api.get(`/registers/shifts?${params.toString()}`);
    return res.data;
  },
  
  getCurrentShift: async (registerId: string) => {
    const res = await api.get(`/registers/${registerId}/current-shift`);
    return res.data;
  }
};