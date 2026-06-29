import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const baseURL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:5000/api';

export const TOKEN_KEYS = {
  access: 'jedida_access_token',
  refresh: 'jedida_refresh_token'
};

const client = axios.create({ baseURL });

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEYS.access);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.refresh);
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
          await SecureStore.setItemAsync(TOKEN_KEYS.access, data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return client(original);
        } catch {
          await SecureStore.deleteItemAsync(TOKEN_KEYS.access);
          await SecureStore.deleteItemAsync(TOKEN_KEYS.refresh);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
