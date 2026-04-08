import { http } from '@/services/http';
export const authApi = {
    login: async (payload) => {
        const response = await http.post('/auth/login', payload);
        return response.data.data;
    },
    register: async (payload) => {
        const response = await http.post('/auth/register', payload);
        return response.data.data;
    },
  me: async () => {
    const response = await http.get('/auth/me');
    return response.data.data;
  },
  updateMe: async (payload) => {
    const response = await http.patch('/auth/me', payload);
    return response.data.data;
  },
  refresh: async () => {
    const response = await http.post('/auth/refresh', {});
    return response.data.data;
  },
  forgotPassword: async (payload) => {
        const response = await http.post('/auth/forgot-password', payload);
        return response.data;
    },
    resetPassword: async (payload) => {
        const response = await http.post('/auth/reset-password', payload);
        return response.data.data;
    },
    logout: async () => {
        await http.post('/auth/logout');
    },
};
