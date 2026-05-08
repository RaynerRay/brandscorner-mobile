import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
      <Ionicons name="information-circle-outline" size={64} color="#6B7280" />
      <Text className="text-xl font-poppins-bold text-gray-900 mt-4 mb-2 text-center">
        Online Payments Unavailable
      </Text>
      <Text className="text-gray-500 font-poppins-medium text-center mb-8">
        We currently accept Cash on Delivery and EchoCash. Place your order via WhatsApp from the cart.
      </Text>
      <TouchableOpacity
        className="bg-gray-900 px-8 py-4 rounded-xl"
        onPress={() => router.back()}
      >
        <Text className="text-white font-poppins-semibold text-base">Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
