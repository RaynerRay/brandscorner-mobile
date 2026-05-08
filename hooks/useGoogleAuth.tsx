import { useMutation } from "@tanstack/react-query";
import axios, { isAxiosError } from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { storeAccessToken } from "@/utils/axiosInstance";

let GoogleSignin: any = null;
try {
  GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin;
} catch {
  // Native module not available — requires a custom dev build, not Expo Go
}

const googleMobileLogin = async (idToken: string) => {
  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/google-mobile-login`,
      { idToken }
    );
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (!error.response) {
        throw new Error("Network error. Please check your connection.");
      }
      const message = error.response.data?.message;
      const status = error.response.status;
      if (status === 401) throw new Error(message || "Google authentication failed.");
      if (status >= 500) throw new Error(message || "Server error. Please try again later.");
      throw new Error(message || "Google login failed.");
    }
    throw new Error("An unexpected error occurred.");
  }
};

export const useGoogleAuth = () => {
  useEffect(() => {
    if (!GoogleSignin) return;
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!GoogleSignin) {
        throw new Error("Google Sign-In is not available in this build.");
      }
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      const idToken = signInResult.data?.idToken;
      if (!idToken) {
        throw new Error("Failed to get ID token from Google.");
      }

      return googleMobileLogin(idToken);
    },
    onSuccess: async (data) => {
      const user = {
        id: data?.user?.id,
        name: data?.user?.name,
        email: data?.user?.email,
        avatar: data?.user?.avatar ?? null,
      };

      await SecureStore.setItemAsync("user", JSON.stringify(user));

      if (data?.accessToken) {
        await storeAccessToken(data.accessToken);
      }
      if (data?.refreshToken) {
        await SecureStore.setItemAsync("refresh_token", data.refreshToken);
      }

      router.replace("/(tabs)");
    },
  });

  const signIn = () => mutation.mutate();

  return {
    signIn,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
