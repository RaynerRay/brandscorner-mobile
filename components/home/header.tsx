import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Header() {
  return (
    <View
      className="flex-row items-center justify-between px-4 bg-white"
      style={{
        paddingVertical: 10,
      }}
    >
      <Text className="text-3xl font-railway text-gray-800">Shop</Text>

      {/* Search Input Field */}
      <View className="flex-1 mx-4">
        <View className="flex-row items-center bg-[#F8F8F8] rounded-3xl px-4">
          <TextInput
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
            className="flex-1 mr-2 text-gray-800 py-2"
          />
          <Ionicons name="search" size={20} color="#9CA3AF" />
        </View>
      </View>

      {/* Notification Icon */}
      <TouchableOpacity>
        <Ionicons name="notifications-outline" size={24} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}
