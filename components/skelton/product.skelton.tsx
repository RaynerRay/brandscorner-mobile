import React from "react";
import { View } from "react-native";

export default function ProductSkeleton({ width }: { width?: number }) {
  return (
    <View
      className="bg-white rounded-lg p-3 mx-2 mb-4 shadow-sm"
      style={{ width: width || 160 }}
    >
      <View className="bg-gray-200 rounded-lg h-32 mb-3 animate-pulse" />
      <View className="bg-gray-200 rounded h-4 mb-2 animate-pulse" />
      <View className="bg-gray-200 rounded h-3 w-3/4 mb-2 animate-pulse" />
      <View className="bg-gray-200 rounded h-4 w-1/2 animate-pulse" />
    </View>
  );
}
