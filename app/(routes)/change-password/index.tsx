import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = (password: string) => {
    if (password.length === 0)
      return { strength: 0, color: "#E5E7EB", text: "" };
    if (password.length < 6)
      return { strength: 1, color: "#EF4444", text: "Weak" };
    if (password.length < 8)
      return { strength: 2, color: "#F59E0B", text: "Fair" };
    if (password.length < 10)
      return { strength: 3, color: "#10B981", text: "Good" };
    return { strength: 4, color: "#059669", text: "Strong" };
  };

  const getPasswordRequirements = (password: string) => {
    return [
      {
        text: "At least 8 characters",
        met: password.length >= 8,
      },
      {
        text: "Contains uppercase letter",
        met: /[A-Z]/.test(password),
      },
      {
        text: "Contains lowercase letter",
        met: /[a-z]/.test(password),
      },
      {
        text: "Contains number",
        met: /\d/.test(password),
      },
      {
        text: "Contains special character",
        met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      },
    ];
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordRequirements = getPasswordRequirements(newPassword);
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword.length > 0;
  const isFormValid =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    passwordsMatch &&
    passwordRequirements.every((req) => req.met);

  const handleUpdatePassword = async () => {
    if (!isFormValid) return;

    setIsLoading(true);

    try {
      await axiosInstance.post("/auth/api/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success("Password updated successfully!");

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Navigate back
      router.back();
    } catch (error: any) {
      console.error("Error updating password:", error);

      // Handle specific error cases
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error?.response?.status === 400) {
        toast.error("Current password is incorrect");
      } else if (error?.response?.status === 401) {
        toast.error("Please log in again to change your password");
      } else {
        toast.error("Failed to update password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-poppins-bold text-gray-900">
            Change Password
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Security Info */}
        <View className="bg-blue-50 rounded-2xl p-4 mb-6">
          <View className="flex-row items-start">
            <Ionicons name="shield-checkmark-outline" size={24} color="#2563EB" />
            <View className="ml-3 flex-1">
              <Text className="text-blue-900 font-poppins-semibold mb-1">
                Password Security
              </Text>
              <Text className="text-blue-700 font-poppins-medium text-sm">
                Choose a strong password to keep your account secure. Use a mix of letters, numbers, and special characters.
              </Text>
            </View>
          </View>
        </View>

        {/* Password Form */}
        <View className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border border-gray-100 p-6 mb-6">
          {/* Current Password */}
          <View className="mb-6">
            <Text className="text-gray-700 font-poppins-semibold mb-2">Current Password</Text>
            <View className="relative">
              <TextInput
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter your current password"
                className="border border-gray-300 rounded-xl px-4 py-3 font-poppins-medium text-gray-900"
              />
              <TouchableOpacity
                className="absolute right-4 top-3"
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View className="mb-6">
            <Text className="text-gray-700 font-poppins-semibold mb-2">New Password</Text>
            <View className="relative">
              <TextInput
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter your new password"
                className="border border-gray-300 rounded-xl px-4 py-3 font-poppins-medium text-gray-900"
              />
              <TouchableOpacity
                className="absolute right-4 top-3"
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength */}
            {newPassword.length > 0 && (
              <View className="mt-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-600 font-poppins-medium text-sm">Password Strength</Text>
                  <Text
                    className="font-poppins-semibold text-sm"
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.text}
                  </Text>
                </View>
                <View className="flex-row gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <View
                      key={level}
                      className={`flex-1 h-2 rounded-full ${level <= passwordStrength.strength
                          ? ""
                          : "bg-gray-200"
                        }`}
                      style={{
                        backgroundColor: level <= passwordStrength.strength
                          ? passwordStrength.color
                          : "#E5E7EB"
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Password Requirements */}
            {newPassword.length > 0 && (
              <View className="mt-4">
                <Text className="text-gray-600 font-poppins-medium text-sm mb-2">Requirements</Text>
                {passwordRequirements.map((requirement, index) => (
                  <View key={index} className="flex-row items-center mb-1">
                    <Ionicons
                      name={requirement.met ? "checkmark-circle" : "ellipse-outline"}
                      size={16}
                      color={requirement.met ? "#059669" : "#9CA3AF"}
                    />
                    <Text
                      className={`ml-2 text-sm font-poppins-medium ${requirement.met ? "text-gray-600" : "text-gray-400"
                        }`}
                    >
                      {requirement.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
            <Text className="text-gray-700 font-poppins-semibold mb-2">Confirm New Password</Text>
            <View className="relative">
              <TextInput
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your new password"
                className={`border rounded-xl px-4 py-3 font-poppins-medium text-gray-900 ${confirmPassword.length > 0
                    ? passwordsMatch
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                    : "border-gray-300"
                  }`}
              />
              <TouchableOpacity
                className="absolute right-4 top-3"
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {confirmPassword.length > 0 && (
              <View className="flex-row items-center mt-2">
                <Ionicons
                  name={passwordsMatch ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={passwordsMatch ? "#059669" : "#EF4444"}
                />
                <Text
                  className={`ml-2 text-sm font-poppins-medium ${passwordsMatch ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          className={`py-4 rounded-xl ${isFormValid && !isLoading
              ? "bg-blue-600"
              : "bg-gray-300"
            }`}
          onPress={handleUpdatePassword}
          disabled={!isFormValid || isLoading}
        >
          <View className="flex-row items-center justify-center">
            {isLoading && (
              <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            )}
            <Text className="text-white font-poppins-semibold text-lg">
              {isLoading ? "Updating..." : "Update Password"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
