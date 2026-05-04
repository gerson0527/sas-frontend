import api from '@/lib/api';

export const financeApi = {
  getBalance: async (storeId: string) => {
    const res = await api.get(`/finance/balance?storeId=${storeId}`);
    return res.data;
  },
  
  getIncome: async (storeId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ storeId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await api.get(`/finance/income?${params.toString()}`);
    return res.data;
  },
  
  getExpenses: async (storeId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ storeId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await api.get(`/finance/expenses?${params.toString()}`);
    return res.data;
  },
  
  getCashFlow: async (storeId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ storeId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await api.get(`/finance/cashflow?${params.toString()}`);
    return res.data;
  },
  
  getAccountsReceivable: async (storeId: string) => {
    const res = await api.get(`/finance/receivable?storeId=${storeId}`);
    return res.data;
  },
  
  getAccountsPayable: async (storeId: string) => {
    const res = await api.get(`/finance/payable?storeId=${storeId}`);
    return res.data;
  }
};