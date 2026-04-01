import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, addToCart } = useStore();

  const handleRemoveFromWishlist = (productId: string) => {
    removeFromWishlist(productId, null, null, "Mobile App");
  };

  const handleAddToCart = (product: any) => {
    addToCart(
      {
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        image: product.image,
        shopId: product.shopId,
        quantity: 1,
      },
      null,
      null,
      "Mobile App"
    );
    router.push("/(tabs)/cart");
  };

  const handleProductPress = (product: any) => {
    router.push({
      pathname: "/(routes)/product/[id]",
      params: {
        id: product.slug,
      },
    });
  };

  if (wishlist.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Header */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-2xl font-poppins-bold text-gray-900">
            Wishlist
          </Text>
          <Text className="text-sm text-gray-500 font-poppins-medium mt-1">
            Home • Wishlist
          </Text>
        </View>

        {/* Empty State */}
        <View className="flex-1 justify-center items-center px-4">
          <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="heart-outline" size={48} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-poppins-bold text-gray-900 mb-2">
            Your wishlist is empty
          </Text>
          <Text className="text-gray-500 text-center font-poppins-medium mb-8">
            Start adding products to your wishlist to see them here
          </Text>
          <TouchableOpacity
            className="bg-blue-600 px-8 py-4 rounded-xl"
            onPress={() => router.push("/(tabs)")}
          >
            <Text className="text-white font-poppins-semibold text-lg">
              Start Shopping
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-poppins-bold text-gray-900">
          Wishlist
        </Text>
        <Text className="text-sm text-gray-500 font-poppins-medium mt-1">
          Home • Wishlist
        </Text>
      </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Wishlist Items */}
        <View className="px-4 py-6">
          {wishlist.map((product, index) => (
            <View key={product.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-4 overflow-hidden">
              <View className="p-4">
                <View className="flex-row">
                  {/* Product Image */}
                  <TouchableOpacity
                    className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden mr-4"
                    onPress={() => handleProductPress(product)}
                  >
                    <Image
                      source={{
                        uri: product.image ||
                          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&crop=center"
                      }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  {/* Product Details */}
                  <View className="flex-1">
                    <TouchableOpacity onPress={() => handleProductPress(product)}>
                      <Text className="text-lg font-poppins-semibold text-gray-900 mb-2" numberOfLines={2}>
                        {product.title}
                      </Text>
                    </TouchableOpacity>

                    {/* Price */}
                    <Text className="text-xl font-poppins-bold text-blue-600 mb-4">
                      ${product.price}
                    </Text>

                    {/* Action Buttons */}
                    <View className="flex-row items-center justify-between">
                      <TouchableOpacity
                        className="bg-blue-600 px-6 py-3 rounded-xl flex-1 mr-3"
                        onPress={() => handleAddToCart(product)}
                      >
                        <Text className="text-white font-poppins-semibold text-center">Add To Cart</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="px-4 py-3"
                        onPress={() => handleRemoveFromWishlist(product.id)}
                      >
                        <View className="flex-row items-center">
                          <Ionicons name="close" size={16} color="#EF4444" />
                          <Text className="text-red-500 font-poppins-medium ml-1">Remove</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View className="h-20" />
      </ScrollView>

    </SafeAreaView>
  );
}
