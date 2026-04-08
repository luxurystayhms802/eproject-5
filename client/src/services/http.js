import axios from 'axios';
import { appEnv } from '@/lib/env';
import { useAuthStore } from '@/app/store/auth-store';

const REQUEST_TIMEOUT_MS = 15_000;

export const http = axios.create({
  baseURL: appEnv.apiBaseUrl,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

let refreshPromise = null;

const isAuthRequest = (url = '') =>
  ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/forgot-password', '/auth/reset-password'].some((path) =>
    String(url).includes(path),
  );

const refreshSession = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${appEnv.apiBaseUrl}/auth/refresh`, {}, { withCredentials: true, timeout: REQUEST_TIMEOUT_MS })
      .then((response) => response.data.data)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().user?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest._skipAuthRefresh ||
      isAuthRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshedUser = await refreshSession();
      useAuthStore.getState().setUser(refreshedUser);
      originalRequest.headers = {
        ...(originalRequest.headers ?? {}),
        Authorization: `Bearer ${refreshedUser.accessToken}`,
      };
      return http(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    }
  },
);
