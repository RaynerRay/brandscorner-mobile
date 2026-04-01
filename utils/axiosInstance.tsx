import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { CustomAxiosRequestConfig } from "./axiosInstance.types";

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_SERVER_URI,
  withCredentials: false, // Disable cookies for React Native
});

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

// Get stored access token
const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync("access_token");
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

// Store access token
export const storeAccessToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync("access_token", token);
  } catch (error) {
    console.error("Error storing access token:", error);
  }
};

// Remove access token
export const removeAccessToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync("access_token");
  } catch (error) {
    console.error("Error removing access token:", error);
  }
};

const handleLogout = () => {};

// Queue failed requests while refreshing
const subscribeTokenRefresh = (callback: () => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshSuccess = () => {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
};

//  Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    // Add authorization header if token exists
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    const is401 = error.response?.status === 401;
    const isRetry = originalRequest._retry;
    const hasAuthHeader = originalRequest.headers?.Authorization;

    // If we have an auth header and get 401, try to refresh the token
    if (is401 && !isRetry && hasAuthHeader) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => resolve(axiosInstance(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token from secure store
        const refreshToken = await SecureStore.getItemAsync("refresh_token");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/refresh-token`,
          { refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        // Store new access token
        if (response.data?.accessToken) {
          await storeAccessToken(response.data.accessToken);
        }

        isRefreshing = false;
        onRefreshSuccess();

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];

        // Clear tokens and redirect to login
        await removeAccessToken();
        await SecureStore.deleteItemAsync("refresh_token");
        await SecureStore.deleteItemAsync("user");

        handleLogout(); // only for protected requests
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
