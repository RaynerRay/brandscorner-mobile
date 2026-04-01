import React from "react";
import { View } from "react-native";

export default function ShopSkeleton() {
  return (
    <View
      className="w-72 bg-white rounded-2xl shadow-lg border border-gray-50 overflow-hidden mr-4"
      style={{ width: 280 }}
    >
      {/* Cover Image Skeleton */}
      <View className="relative">
        <View className="w-full h-32 bg-gray-200 animate-pulse" />
        {/* Avatar Skeleton */}
        <View className="absolute -bottom-8 left-4">
          <View className="w-16 h-16 bg-white rounded-full p-1 shadow-lg">
            <View className="w-full h-full rounded-full bg-gray-200 animate-pulse" />
          </View>
        </View>
      </View>

      {/* Content Skeleton */}
      <View className="pt-10 px-4 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="bg-gray-200 rounded h-5 flex-1 mr-3 animate-pulse" />
          <View className="bg-gray-200 rounded-full px-3 py-1 w-16 h-6 animate-pulse" />
        </View>

        <View className="bg-gray-200 rounded h-4 w-3/4 mb-3 animate-pulse" />

        {/* Stats Skeleton */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
            <View className="bg-gray-200 rounded h-3 w-8 ml-1 animate-pulse" />
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
            <View className="bg-gray-200 rounded h-3 w-16 ml-1 animate-pulse" />
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
            <View className="bg-gray-200 rounded h-3 w-12 ml-1 animate-pulse" />
          </View>
        </View>
      </View>
    </View>
  );
}
