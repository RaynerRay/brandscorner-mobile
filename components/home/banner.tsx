import VectorSvg from "@/assets/svgs/vector";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function BigSaleBanner() {
  return (
    <View className="mx-4 my-4">
      <TouchableOpacity className="rounded-xl overflow-hidden relative shadow-lg">
        <Image
          source={require("@/assets/images/banners/2.jpg")}
          className="w-full h-48"
          resizeMode="cover"
        />

        {/* Gradiant overlay for better text readability */}
        <LinearGradient
          colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.1)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute inset-0"
        />
        {/* Text overlay on the left side */}
        <View className="absolute left-0 top-0 bottom-0 justify-center px-6 w-3/5">
          <Text
            className="text-gray-800 font-poppins-medium text-4xl font-bold mb-2 leading-tight"
            style={{
              textShadowColor: "rgba(255, 255, 255, 0.8)",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}
          >
            Big Sale
          </Text>
          <Text
            className="text-gray-700 text-lg mb-8 font-medium font-poppins"
            style={{
              textShadowColor: "rgba(255, 255, 255, 0.8)",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}
          >
            Up to 50%
          </Text>

          <View className="relative">
            <View className="absolute -bottom-11 -left-6">
              <VectorSvg />
            </View>
            <View className="absolute -bottom-9">
              <Text className="text-white font-bold text-sm">Happening</Text>
              <Text className="text-white font-bold text-sm">Now</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
