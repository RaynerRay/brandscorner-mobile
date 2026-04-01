import useUser from "@/hooks/useUser";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

interface Shop {
  id: string;
  name: string;
  avatar: string;
  ratings: number;
  followers: any;
  totalSales: number;
  category: string;
  coverBanner: string;
}

export default function ShopCard({
  shop,
  onPress,
}: {
  shop: Shop;
  onPress?: () => void;
}) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Calculate isFollowing dynamically based on current user and shop followers
  const isFollowing = React.useMemo(() => {
    if (!user || !shop?.followers) return false;
    return shop.followers.some(
      (follower: any) => follower?.userId === user?.id
    );
  }, [user, shop?.followers]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error("Please login to follow shops");
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await axiosInstance.post(`/seller/api/unfollow-shop`, {
          shopId: shop.id,
        });
        toast.success("Unfollowed successfully");
      } else {
        // Follow
        await axiosInstance.post(`/seller/api/follow-shop`, {
          shopId: shop.id,
        });
        toast.success("Followed successfully");
      }

      // Invalidate and refetch shops data to update the UI
      await queryClient.invalidateQueries({ queryKey: ["shops"] });
    } catch (error) {
      console.error("Follow/Unfollow error:", error);
      toast.error("Failed to update follow status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      className="w-72 bg-white rounded-2xl shadow-lg border border-gray-50 overflow-hidden mr-4"
      style={{ width: 280 }}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View className="relative">
        <Image
          source={{ uri: shop?.coverBanner }}
          className="w-full h-32 bg-gray-100"
          resizeMode="cover"
        />
        {/* Shop Avatar */}
        <View className="absolute -bottom-8 left-4">
          <View className="w-16 h-16 bg-white rounded-full p-1 shadow-lg">
            <Image
              source={{ uri: shop.avatar }}
              className="w-full h-full rounded-full"
              resizeMode="cover"
            />
          </View>
        </View>
      </View>

      <View className="pt-10 px-4 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text
            className="text-lg font-poppins-semibold text-gray-900 flex-1 mr-3"
            numberOfLines={1}
          >
            {shop.name}
          </Text>
          <TouchableOpacity
            className={`px-3 py-1 rounded-full border ${
              isFollowing
                ? "bg-gray-50 border-gray-200"
                : "bg-blue-50 border-blue-100"
            }`}
            onPress={handleFollowToggle}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text
              className={`font-poppins-semibold text-xs ${
                isFollowing ? "text-gray-600" : "text-blue-600"
              }`}
            >
              {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-sm text-gray-500 mb-3 capitalize">
          {shop.category}
        </Text>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="star" size={14} color="#FCD34D" />
            <Text className="text-sm font-poppins-medium text-gray-700 ml-1">
              {shop.ratings}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="people" size={14} color="#6B7280" />
            <Text className="text-sm font-poppins-medium text-gray-600 ml-1">
              {Array.isArray(shop.followers)
                ? shop.followers.length
                : shop.followers}{" "}
              followers
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="cube" size={14} color="#6B7280" />
            <Text className="text-sm font-poppins-medium text-gray-600 ml-1">
              {shop.totalSales} Sales
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
