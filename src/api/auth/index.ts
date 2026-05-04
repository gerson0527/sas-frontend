import api from '@/lib/api';

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  
  register: async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  },
  
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  
  updatePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    const res = await api.post('/auth/update-password', { userId, currentPassword, newPassword });
    return res.data;
  },

  setFirstPassword: async (password: string) => {
    const res = await api.patch('/auth/password', { password });
    return res.data;
  },
};