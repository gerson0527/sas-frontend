import api from '@/lib/api';

export const productsApi = {
  getAll: async (storeId: string) => {
    const res = await api.get(`/products?storeId=${storeId}`);
    return res.data;
  },
  
  getById: async (id: string) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },
  
  create: async (data: {
    name: string;
    sku?: string;
    SKU?: string;
    supplierId?: string;
    cost?: number;
    regularPrice?: number;
    price: number;
    stock?: number;
    minStock?: number;
    maxStock?: number;
    taxType?: string;
    taxRate?: number;
    unitMeasure?: string;
    standardCode?: string;
    image?: string;
    storeId: string;
    categoryId?: string;
    subcategoryId?: string;
  }) => {
    const res = await api.post('/products', data);
    return res.data;
  },
  
  update: async (id: string, data: Partial<{
    name: string;
    sku: string;
    SKU: string;
    supplierId: string;
    cost: number;
    regularPrice: number;
    price: number;
    stock: number;
    minStock: number;
    maxStock: number;
    taxType: string;
    taxRate: number;
    unitMeasure: string;
    standardCode: string;
    image: string;
    categoryId: string;
    subcategoryId: string;
  }>) => {
    const res = await api.put(`/products/${id}`, data);
    return res.data;
  },
  
  delete: async (id: string) => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },
  
  updateStock: async (id: string, quantity: number, type: 'ADD' | 'SUBTRACT') => {
    const res = await api.post(`/products/${id}/stock`, { quantity, type });
    return res.data;
  },
  
  getLowStock: async (storeId: string) => {
    const res = await api.get(`/products/low-stock?storeId=${storeId}`);
    return res.data;
  },
  
  search: async (storeId: string, query: string) => {
    const res = await api.get(`/products/search?storeId=${storeId}&q=${query}`);
    return res.data;
  }
};