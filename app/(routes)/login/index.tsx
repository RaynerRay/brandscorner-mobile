import GoogleSignInButton from "@/components/GoogleSignInButton";
import { storeAccessToken } from "@/utils/axiosInstance";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import axios, { isAxiosError } from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

interface LoginFormData {
  email: string;
  password: string;
}

const loginUser = async (userData: LoginFormData) => {
  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/login-user`,
      userData,
    );

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      // Handle Axios specific errors
      if (!error.response) {
        throw new Error("Network error. Please check your connection.");
      }

      // Handle different status codes
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 400 || status === 422) {
        throw new Error(errorData?.message || "Invalid email or password");
      } else if (status === 401) {
        throw new Error(
          errorData?.message ||
            "Invalid credentials. Please check your email and password.",
        );
      } else if (status === 404) {
        throw new Error(
          errorData?.message || "Account not found. Please sign up first.",
        );
      } else if (status === 429) {
        throw new Error(
          errorData?.message ||
            "Too many login attempts. Please try again later.",
        );
      } else if (status >= 500) {
        throw new Error(
          errorData?.message || "Server error. Please try again later.",
        );
      } else {
        throw new Error(errorData?.message || "Login failed");
      }
    }

    // For non-Axios errors
    throw new Error("An unexpected error occurred");
  }
};

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const loginForm = useForm<LoginFormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      toast.success("Login successful! Welcome back.");

      const user = {
        id: data?.user?.id,
        name: data?.user?.name,
        email: data?.user?.email,
        avatar: data?.user?.avatar,
      };

      // Store user data and tokens
      await SecureStore.setItemAsync("user", JSON.stringify(user));

      // Store access token if available
      if (data?.accessToken) {
        await storeAccessToken(data.accessToken);
      }

      if (data?.refreshToken) {
        await SecureStore.setItemAsync("refresh_token", data.refreshToken);
      }

      router.replace("/(tabs)");
    },
    onError: (error: Error) => {
      toast.error(error?.message);
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    // Trigger the mutation
    loginMutation.mutate(data);
  };

  const handleSignUpNavigation = () => {
    router.push("/(routes)/signup");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mt-8 mb-4">
            <Text className="text-3xl font-poppins-bold text-gray-900 mb-2">
              Welcome Back
            </Text>
            <Text className="text-gray-500 font-poppins text-base">
              Sign in to your account
            </Text>
          </View>

          {/* Form fields */}
          <View className="gap-6 mt-8">
            {/* Email Field */}
            <View className="mt-6">
              <Text className="text-gray-800 text-base font-poppins-medium mb-3">
                Email
              </Text>
              <Controller
                control={loginForm.control}
                name="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${
                      loginForm.formState.errors.email
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                  >
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={20}
                      color={"#9CA3AF"}
                    />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800 font-poppins"
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!loginMutation.isPending}
                    />
                    {loginForm.formState.errors.email && (
                      <Text className="text-red-500 text-sm font-poppins mt-1">
                        {loginForm.formState.errors.email.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </View>

            {/* Password Field */}
            <View>
              <Text className="text-gray-800 text-base font-poppins-medium mb-3">
                Password
              </Text>
              <Controller
                control={loginForm.control}
                name="password"
                rules={{
                  required: "Password is required",
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`
                  flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${
                    loginForm.formState.errors.password
                      ? "border-red-500"
                      : "border-gray-200"
                  }
                  `}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#9CA3AF"
                    />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800 font-poppins"
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      editable={!loginMutation.isPending}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={loginMutation.isPending}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {loginForm.formState.errors.password && (
                <Text className="text-red-500 text-sm font-poppins mt-1">
                  {loginForm.formState.errors.password.message}
                </Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              className="self-end mt-2"
              onPress={() => router.push("/(routes)/forgot-password")}
              disabled={loginMutation.isPending}
            >
              <Text className="text-blue-600 font-poppins-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`rounded-xl py-4 mt-8 ${
              loginForm.formState.isValid && !loginMutation.isPending
                ? "bg-blue-600"
                : "bg-gray-400"
            }`}
            onPress={loginForm.handleSubmit(onLoginSubmit)}
            disabled={!loginForm.formState.isValid || loginMutation.isPending}
          >
            <Text className="text-white text-center text-lg font-poppins-semibold">
              {loginMutation.isPending ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-4 text-gray-500 font-poppins">
              Or using other method
            </Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          {/* Social Login Buttons */}
          <View className="mb-8">
            <GoogleSignInButton
              label="Sign In with Google"
              disabled={loginMutation.isPending}
            />
          </View>

          {/* Switch to Sign Up Link */}
          <View className="flex-row justify-center mb-8">
            <Text className="text-gray-600 font-poppins">
              Don&apos;t have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={handleSignUpNavigation}
              disabled={loginMutation.isPending}
            >
              <Text className="text-blue-600 font-poppins-semibold">
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
