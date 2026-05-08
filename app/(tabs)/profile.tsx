import useUser, { User } from "@/hooks/useUser";
import axiosInstance from "@/utils/axiosInstance";
import { useStore } from "@/store";
import { Ionicons, SimpleLineIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function Profile() {
  const { user, updateUserData } = useUser();
  const cart = useStore((state: any) => state.cart);
  const cartCount = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);

  const { data: ordersData } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await axiosInstance.get("/order/api/get-user-orders");
      return res.data.orders as any[];
    },
  });

  const { data: followingData } = useQuery({
    queryKey: ["user-following-count"],
    queryFn: async () => {
      const res = await axiosInstance.get("/seller/api/user-following-count");
      return res.data.count as number;
    },
  });

  const ordersCount = ordersData?.length ?? 0;
  const followingCount = followingData ?? 0;

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [appliedFeatures, setAppliedFeatures] = useState<string[]>([]);
  const [isApplyingAI, setIsApplyingAI] = useState(false);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        toast.error("Permission Required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setShowAIFeatures(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      toast.error("Failed to pick image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        toast.error("Sorry, we need camera permissions to make this work!");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setShowAIFeatures(true);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      toast.error("Failed to take photo. Please try again.");
    }
  };

  const uploadImage = async (imageUri: string) => {
    setIsUploading(true);

    try {
      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async () => {
          try {
            const base64 = reader.result as any;
            const base64Data = base64.split(",")[1];

            // upload image to ImageKit
            const formData = new FormData();
            formData.append("file", base64Data);
            formData.append("fileName", `profile_${Date.now()}.jpg`);
            formData.append("useUniqueFileName", "true");
            formData.append("folder", "/profile-avatars");

            const imageKitResponse = await fetch(
              "https://upload.imagekit.io/api/v1/files/upload",
              {
                method: "POST",
                headers: {
                  Authorization: `Basic ${btoa(
                    process.env.EXPO_PUBLIC_IMAGEKIT_PRIVATE_KEY! + ":"
                  )}`,
                },
                body: formData,
              }
            );

            const imageKitData = await imageKitResponse.json();

            if (imageKitData.url) {
              const imageKitUrl = imageKitData.url;
              const publicId = imageKitData.fileId;

              setUploadedImageUrl(imageKitUrl);
              setUploadedImageId(publicId);
              setShowAIFeatures(true);
              toast.success(
                "Image uploaded successfully! Now you can apply AI features."
              );
            } else {
              throw new Error("Failed to upload to ImageKit");
            }
            resolve(imageKitData);
          } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Failed to upload image. Please try again.");
            reject(error);
          } finally {
            setIsUploading(false);
          }
        };

        reader.onerror = () => {
          setIsUploading(false);
          toast.error("Failed to process image. Please try again.");
          reject(new Error("Failed to read image"));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image:", error);
      toast.error("Failed to process image. Please try again.");
      setIsUploading(false);
    }
  };

  const applyAIFeature = async (feature: string) => {
    if (!uploadedImageUrl) return;

    setIsApplyingAI(true);

    try {
      // Get the base URL without any existing transformations
      const baseUrl = uploadedImageUrl.split("?")[0];

      // Build transformation string based on selected features
      let transformations = [];

      // Add the new feature
      switch (feature) {
        case "bg-remove":
          transformations.push("e-bgremove");
          break;
        case "relight":
          transformations.push("e-relight");
          break;
        case "quality-improve":
          transformations.push("e-retouch");
          break;
        default:
          break;
      }

      // Add timestamp for cache busting
      const timestamp = Date.now();
      const finalUrl = `${baseUrl}?tr=${transformations.join(
        ","
      )}&t=${timestamp}`;

      // Simulate loading time for better UX
      await new Promise((resolve) => setTimeout(resolve, 6000));

      setUploadedImageUrl(finalUrl);

      // Update applied features
      if (appliedFeatures.includes(feature)) {
        setAppliedFeatures(appliedFeatures.filter((f) => f !== feature));
      } else {
        setAppliedFeatures([...appliedFeatures, feature]);
      }

      toast.success(`${feature} applied successfully!`);
    } catch (error) {
      console.error(`Error applying ${feature}:`, error);
      toast.error(`Failed to apply ${feature}. Please try again.`);
    } finally {
      setIsApplyingAI(false);
    }
  };

  const logOutHandler = async () => {
    await SecureStore.deleteItemAsync("user");
    await SecureStore.deleteItemAsync("access_token");

    router.replace("/(routes)/login");
  };

  const saveFinalImage = async () => {
    if (!uploadedImageUrl) return;

    try {
      const avatarData = {
        file_id: uploadedImageId,
        url: uploadedImageUrl,
      };

      const response = await axiosInstance.post("/auth/api/update-avatar", {
        avatar: avatarData,
      });

      if (response.data.success) {
        // Update user data with new avatar
        if (response.data.user) {
          await updateUserData(response.data.user as User);
        }

        toast.success("Profile photo updated successfully!");
        setShowPhotoModal(false);
        setSelectedImage(null);
        setUploadedImageUrl(null);
        setShowAIFeatures(false);
        setAppliedFeatures([]);
      }
    } catch (error) {
      console.error("Error updating profile photo:", error);
      toast.error("Failed to update profile photo. Please try again.");
    }
  };

  const menuItems = [
    {
      id: "orders",
      title: "My Orders",
      subtitle: "Track your orders and view history",
      icon: "bag-outline",
      iconColor: "#2563EB",
      iconBg: "#DBEAFE",
      onPress: () => router.push("/(routes)/my-orders"),
    },
    {
      id: "inbox",
      title: "Inbox",
      subtitle: "View your messages",
      icon: "mail-outline",
      iconColor: "#059669",
      iconBg: "#D1FAE5",
      onPress: () => router.push("/(tabs)/messages"),
    },
    {
      id: "notifications",
      title: "Notifications",
      subtitle: "Manage your notifications",
      icon: "notifications-outline",
      iconColor: "#D97706",
      iconBg: "#FEF3C7",
      onPress: () => router.push("/(routes)/notifications"),
    },
    {
      id: "shipping",
      title: "Shipping Address",
      subtitle: "Manage your delivery addresses",
      icon: "location-outline",
      iconColor: "#7C3AED",
      iconBg: "#EDE9FE",
      onPress: () => router.push("/(routes)/shipping"),
    },
    {
      id: "password",
      title: "Change Password",
      subtitle: "Update your account password",
      icon: "lock-closed-outline",
      iconColor: "#DC2626",
      iconBg: "#FEE2E2",
      onPress: () => router.push("/(routes)/change-password"),
    },
    {
      id: "settings",
      title: "Account Settings",
      subtitle: "Manage your account preferences",
      icon: "settings-outline",
      iconColor: "#6B7280",
      iconBg: "#F3F4F6",
      onPress: () => router.push("/(routes)/settings"),
    },
  ];

  const renderPhotoModal = () => (
    <Modal
      visible={showPhotoModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
          <Text className="text-xl font-poppins-medium text-gray-800">
            Change Photo
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowPhotoModal(false);
              setSelectedImage(null);
              setShowAIFeatures(false);
            }}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {!selectedImage ? (
            // Upload Options
            <View className="gap-2">
              <Text className="text-lg font-poppins-medium text-gray-700">
                Choose how you want to add your photo
              </Text>

              <TouchableOpacity
                className="flex-row mb-2 items-center p-4 border border-gray-200 rounded-xl"
                onPress={takePhoto}
              >
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="camera" size={24} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-poppins-semibold text-gray-800">
                    Take Photo
                  </Text>
                  <Text className="text-gray-500 font-poppins-medium">
                    Use your camera to take a new photo
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-4 border border-gray-200 rounded-xl"
                onPress={pickImage}
              >
                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="images" size={24} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-poppins-semibold text-gray-800">
                    Choose from Library
                  </Text>
                  <Text className="text-gray-500 font-poppins-medium">
                    Select a photo from your gallery
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ) : (
            // Image Preview and AI Features
            <View className="space-y-6">
              <View className="items-center">
                {isApplyingAI ? (
                  <View className="w-32 h-32 rounded-full bg-gray-100 items-center justify-center">
                    <View className="animate-spin">
                      <Ionicons name="refresh" size={32} color="#6B7280" />
                    </View>
                    <Text className="text-xs text-gray-500 mt-2">
                      Applying AI...
                    </Text>
                  </View>
                ) : (
                  <Image
                    key={uploadedImageUrl || selectedImage}
                    source={{ uri: uploadedImageUrl || selectedImage }}
                    className="w-32 h-32 rounded-full"
                    resizeMode="cover"
                  />
                )}
                <Text className="text-base font-poppins-medium text-gray-600 mt-2 mb-4">
                  Preview
                </Text>
              </View>

              {!uploadedImageUrl ? (
                // Upload Button
                <View className="space-y-4">
                  <Text className="text-lg font-poppins-semibold text-gray-900 text-center">
                    Ready to upload your photo?
                  </Text>
                  <TouchableOpacity
                    className="py-3 bg-blue-600 rounded-xl"
                    onPress={() => selectedImage && uploadImage(selectedImage)}
                    disabled={isUploading}
                  >
                    <Text className="text-center font-poppins-semibold text-white">
                      {isUploading ? "Uploading..." : "Upload Photo"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // AI Features
                <View className="gap-4">
                  <Text className="text-lg font-poppins-medium text-gray-700">
                    Enhance your photo with AI
                  </Text>

                  <View className="gap-3">
                    <TouchableOpacity
                      className={`flex-row items-center p-3 border rounded-xl ${
                        appliedFeatures.includes("bg-remove")
                          ? "border-purple-300 bg-purple-50"
                          : "border-gray-200"
                      }`}
                      onPress={() => applyAIFeature("bg-remove")}
                      disabled={isApplyingAI}
                    >
                      <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
                        <Ionicons name="cut" size={20} color="#7C3AED" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-poppins-semibold text-gray-900">
                          Remove Background
                        </Text>
                        <Text className="text-gray-500 text-sm font-poppins-medium">
                          Remove background automatically
                        </Text>
                      </View>
                      {appliedFeatures.includes("bg-remove") && (
                        <View className="w-6 h-6 bg-purple-600 rounded-full items-center justify-center">
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`flex-row items-center p-3 border rounded-xl ${
                        appliedFeatures.includes("relight")
                          ? "border-yellow-300 bg-yellow-50"
                          : "border-gray-200"
                      }`}
                      onPress={() => applyAIFeature("relight")}
                      disabled={isApplyingAI}
                    >
                      <View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center mr-3">
                        <Ionicons name="sunny" size={20} color="#F59E0B" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-poppins-semibold text-gray-900">
                          Relight
                        </Text>
                        <Text className="text-gray-500 text-sm font-poppins-medium">
                          Improve lighting and shadows
                        </Text>
                      </View>
                      {appliedFeatures.includes("relight") && (
                        <View className="w-6 h-6 bg-yellow-600 rounded-full items-center justify-center">
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`flex-row items-center p-3 border rounded-xl ${
                        appliedFeatures.includes("quality-improve")
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-200"
                      }`}
                      onPress={() => applyAIFeature("quality-improve")}
                      disabled={isApplyingAI}
                    >
                      <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                        <Ionicons name="sparkles" size={20} color="#2563EB" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-poppins-semibold text-gray-900">
                          Quality Improve
                        </Text>
                        <Text className="text-gray-500 text-sm font-poppins-medium">
                          Enhance image quality and resolution
                        </Text>
                      </View>
                      {appliedFeatures.includes("quality-improve") && (
                        <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View className="flex-row gap-3 pt-4">
                <TouchableOpacity
                  className="flex-1 py-3 border border-gray-300 rounded-xl"
                  onPress={() => {
                    setSelectedImage(null);
                    setUploadedImageUrl(null);
                    setShowAIFeatures(false);
                  }}
                >
                  <Text className="text-center font-poppins-semibold text-gray-700">
                    Cancel
                  </Text>
                </TouchableOpacity>
                {uploadedImageUrl && (
                  <TouchableOpacity
                    className="flex-1 py-3 bg-blue-600 rounded-xl"
                    onPress={saveFinalImage}
                  >
                    <Text className="text-center font-poppins-semibold text-white">
                      Save Photo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-white">
      <StatusBar barStyle={"dark-content"} backgroundColor={"#ffffff"} />

      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-poppins-bold text-gray-900">
          Profile
        </Text>
        <Text className="text-sm text-gray-500 font-poppins-medium mt-1">
          Welcome back, {user?.name || "User"} 👋
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Profile Header Card */}
          <View className="bg-white rounded-2xl shadow-[0_0_3px_rgba(0,0,0,0.1)] border border-gray-100 p-6 mb-6">
            <View className="flex-row items-center mb-6">
              <View className="relative items-center mb-6">
                <View className="relative">
                  <Image
                    source={{
                      uri:
                        user?.avatar?.url ||
                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                    }}
                    className="w-20 h-20 rounded-full"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full items-center justify-center"
                    onPress={() => setShowPhotoModal(true)}
                  >
                    <Ionicons name="camera" size={12} color={"#fff"} />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-xl font-poppins-bold text-gray-900">
                  {user?.name || "User Name"}
                </Text>
                <Text className="text-gray-500 font-poppins-medium">
                  {user?.email || "user@example.com"}
                </Text>
                <TouchableOpacity
                  className="mt-2"
                  onPress={() => setShowPhotoModal(true)}
                >
                  <Text className="text-blue-600 font-poppins-medium text-sm">
                    Change Photo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Stats */}
            <View className="flex-row gap-4">
              <View className="flex-1 bg-gray-50 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="time-outline" size={16} color={"#6B7280"} />
                  <Text className="text-gray-600 font-poppins-medium ml-2 text-sm">
                    Orders
                  </Text>
                </View>
                <Text className="text-xl font-poppins-bold text-gray-900">
                  {ordersCount}
                </Text>
              </View>

              <View className="flex-1 bg-gray-50 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <SimpleLineIcons
                    name="user-following"
                    size={16}
                    color="#6B7280"
                  />
                  <Text className="text-gray-600 font-poppins-medium ml-2 text-sm">
                    Following
                  </Text>
                </View>
                <Text className="text-xl font-poppins-bold text-gray-900">
                  {followingCount}
                </Text>
              </View>

              <View className="flex-1 bg-gray-50 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="bag-outline" size={16} color={"#6B7280"} />
                  <Text className="text-gray-600 font-poppins-medium ml-2 text-sm">
                    Cart
                  </Text>
                </View>
                <Text className="text-xl font-poppins-bold text-gray-900">
                  {cartCount}
                </Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View className="gap-4">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border border-gray-100 p-4"
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: item.iconBg }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={item.iconColor}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-poppins-semibold text-gray-900">
                      {item.title}
                    </Text>
                    <Text className="text-gray-500 font-poppins-medium text-sm">
                      {item.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            className="bg-red-50 rounded-2xl border border-red-200 p-4 mt-6"
            onPress={() => logOutHandler()}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text className="ml-2 font-poppins-semibold text-red-500 text-lg">
                Logout
              </Text>
            </View>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </View>
      </ScrollView>

      {renderPhotoModal()}
    </SafeAreaView>
  );
}
