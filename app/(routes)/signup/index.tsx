import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import axios, { isAxiosError } from "axios";
import { router } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
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

interface SignupFormData {
  name: string;
  email: string;
  password: string;
}

const signupUser = async (userData: SignupFormData) => {
  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/user-registration`,
      userData,
    );

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (!error.response) {
        throw new Error("Network error. Please check your connection!");
      }

      // handle different status codes
      const status = error?.response?.status;
      const errorData = error?.response?.data;

      if (status === 400 || status === 422) {
        throw new Error(errorData?.message || "Invalid input data");
      } else if (status === 409) {
        throw new Error(
          errorData?.message || "User already exist with this email",
        );
      } else if (status >= 500) {
        throw new Error(
          errorData?.message || "Server error. Please try again later!",
        );
      } else {
        throw new Error(errorData?.message || "Signup failed");
      }
    }

    throw new Error("An unexpected error occurred");
  }
};

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);

  // Signup form
  const signupForm = useForm<SignupFormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: signupUser,
    onSuccess: (data, variables) => {
      router.replace({
        pathname: "/(routes)/signup-otp",
        params: {
          name: variables.name,
          email: variables?.email,
          password: variables.password,
        },
      });
    },
    onError: (error: Error) => {
      toast.error(error?.message);
    },
  });

  const onSignupSubmit = (data: SignupFormData) => {
    // Trigger the mutation
    signupMutation.mutate(data);
  };

  const handleSignInNavigation = () => {
    router.push("/(routes)/login");
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
              Create Account
            </Text>
            <Text className="text-gray-500 font-poppins text-base">
              Start exploring by creating your account
            </Text>
          </View>

          {/* Form fields */}
          <View className="gap-6 mt-8">
            {/* Name Field */}
            <View>
              <Text className="text-gray-800 text-base font-poppins-medium mb-3">
                Name
              </Text>
              <Controller
                control={signupForm.control}
                name="name"
                rules={{
                  required: "Name is required",
                  minLength: {
                    value: 3,
                    message: "Name must be at least 3 characters",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${
                      signupForm.formState.errors.name
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                  >
                    <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800 font-poppins"
                      placeholder="Create your name"
                      placeholderTextColor="#9CA3AF"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      editable={!signupMutation.isPending}
                    />
                  </View>
                )}
              />
              {signupForm.formState.errors.name && (
                <Text className="text-red-500 text-sm font-poppins mt-1">
                  {signupForm.formState.errors.name.message}
                </Text>
              )}
            </View>

            {/* Email Field */}
            <View>
              <Text className="text-gray-800 text-base font-poppins-medium mb-3">
                Email
              </Text>
              <Controller
                control={signupForm.control}
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
                      signupForm.formState.errors.email
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
                      editable={!signupMutation.isPending}
                    />
                    {signupForm.formState.errors.email && (
                      <Text className="text-red-500 text-sm font-poppins mt-1">
                        {signupForm.formState.errors.email.message}
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
                control={signupForm.control}
                name="password"
                rules={{
                  required: "Password is required",
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`
                  flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${
                    signupForm.formState.errors.password
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
                      editable={!signupMutation.isPending}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={signupMutation.isPending}
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
              {signupForm.formState.errors.password && (
                <Text className="text-red-500 text-sm font-poppins mt-1">
                  {signupForm.formState.errors.password.message}
                </Text>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`rounded-xl py-4 mt-8 ${
              signupForm.formState.isValid ? "bg-blue-600" : "bg-gray-400"
            }`}
            onPress={signupForm.handleSubmit(onSignupSubmit)}
            disabled={!signupForm.formState.isValid || signupMutation.isPending}
          >
            <Text className="text-white text-center text-lg font-poppins-semibold">
              {signupMutation.isPending
                ? "Creating Account..."
                : "Create Account"}
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
          <View className="space-y-4 mb-8">
            {/* Google Sign In */}
            <TouchableOpacity
              className="flex-row items-center mb-4 justify-center bg-white border border-gray-200 rounded-xl py-4"
              disabled={signupMutation.isPending}
            >
              <View className="w-6 h-6 mr-3">
                <Image
                  source={{
                    uri: "https://developers.google.com/identity/images/g-logo.png",
                  }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </View>
              <Text className="text-gray-800 text-base font-poppins-medium">
                Sign Up with Google
              </Text>
            </TouchableOpacity>

            {/* Facebook Sign In */}
            {/* <TouchableOpacity
              className="flex-row items-center justify-center bg-white border border-gray-200 rounded-xl py-4"
              disabled={signupMutation.isPending}
            >
              <Ionicons
                name="logo-facebook"
                size={24}
                color="#1877F2"
                className="mr-3"
              />
              <Text className="text-gray-800 text-base font-poppins-medium ml-3">
                Sign Up with Facebook
              </Text>
            </TouchableOpacity> */}
          </View>

          {/* Switch to Sign Up Link */}
          <View className="flex-row justify-center mb-8">
            <Text className="text-gray-600 font-poppins">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={handleSignInNavigation}
              disabled={signupMutation.isPending}
            >
              <Text className="text-blue-600 font-poppins-semibold">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
