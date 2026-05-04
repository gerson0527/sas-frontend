import api from '@/lib/api';

export const categoriesApi = {
  getAll: async (storeId: string) => {
    const res = await api.get(`/categories?storeId=${storeId}`);
    return res.data;
  },
  
  getById: async (id: string) => {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },
  
  create: async (data: {
    name: string;
    storeId: string;
    parentId?: string;
  }) => {
    const res = await api.post('/categories', data);
    return res.data;
  },
  
  update: async (id: string, data: { name: string }) => {
    const res = await api.put(`/categories/${id}`, data);
    return res.data;
  },
  
  delete: async (id: string) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
  
  getSubcategories: async (categoryId: string) => {
    const res = await api.get(`/categories/${categoryId}/subcategories`);
    return res.data;
  }
};