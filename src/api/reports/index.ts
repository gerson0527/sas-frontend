import api from '@/lib/api';

export const reportsApi = {
  getSalesReport: async (storeId: string, startDate: string, endDate: string) => {
    const res = await api.get(`/reports/sales?storeId=${storeId}&startDate=${startDate}&endDate=${endDate}`);
    return res.data;
  },
  
  getProductsReport: async (storeId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ storeId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await api.get(`/reports/products?${params.toString()}`);
    return res.data;
  },
  
  getCustomersReport: async (storeId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ storeId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await api.get(`/reports/customers?${params.toString()}`);
    return res.data;
  },
  
  getInventoryReport: async (storeId: string) => {
    const res = await api.get(`/reports/inventory?storeId=${storeId}`);
    return res.data;
  },
  
  getFinancialReport: async (storeId: string, startDate: string, endDate: string) => {
    const res = await api.get(`/reports/financial?storeId=${storeId}&startDate=${startDate}&endDate=${endDate}`);
    return res.data;
  },
  
  exportPDF: async (reportType: string, params: any) => {
    const res = await api.post(`/reports/export`, { reportType, ...params });
    return res.data;
  },
  
  exportExcel: async (reportType: string, params: any) => {
    const res = await api.post(`/reports/export-excel`, { reportType, ...params });
    return res.data;
  }
};