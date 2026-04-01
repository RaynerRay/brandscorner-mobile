import useUser from "@/hooks/useUser";
import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

interface ProductCardProps {
  product: any;
  showActions?: boolean;
}

export default function ProductCard({
  product,
  showActions = true,
}: ProductCardProps) {

  const { wishlist, addToWishlist, removeFromWishlist } = useStore();
  const { user } = useUser();

  const handleProductPress = (product: any) => {
    router.push({
      pathname: "/(routes)/product/[id]",
      params: {
        id: product.slug || product.id,
      },
    });
  };

  const handleWishlistToggle = (product: any, e: any) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add items to wishlist");
      return;
    }

    const isInWishlist = wishlist.some((item) => item.id === product.id);

    if (isInWishlist) {
      removeFromWishlist(product.id, user, null, "Mobile App");
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(
        {
          id: product.id,
          slug: product.slug,
          title: product.title,
          price: product.sale_price || product.regular_price,
          image: product.images?.[0]?.url || "",
          shopId: product.Shop?.id || "",
        },
        user,
        null,
        "Mobile App"
      );
      toast.success("Added to wishlist");
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  const discountPercentage = product?.sale_price
    ? Math.round(
        ((product.regular_price - product.sale_price) / product.regular_price) *
          100
      )
    : 0;

  return (
    <TouchableOpacity
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      style={{ width: "48%" }}
      onPress={() => handleProductPress(product)}
      activeOpacity={0.9}
    >
      {/* Product Image */}
      <View className="relative">
        <Image
          source={{
            uri:
              product.images?.[0]?.url ||
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&crop=center",
          }}
          className="w-full h-32 bg-gray-100"
          resizeMode="cover"
        />

        {/* Action Icons */}
        {showActions && (
          <View className="absolute top-2 right-2 space-y-1">
            <TouchableOpacity
              className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full items-center justify-center shadow-md"
              onPress={(e) => handleWishlistToggle(product, e)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isInWishlist(product.id) ? "heart" : "heart-outline"}
                size={16}
                color={isInWishlist(product.id) ? "#EF4444" : "#EF4444"}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <View className="absolute top-2 left-2 bg-red-500 px-1.5 py-0.5 rounded-full">
            <Text className="text-white text-xs font-bold">
              -{discountPercentage}%
            </Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View className="p-3">
        <Text className="text-xs text-gray-500 font-poppins-medium mb-1" numberOfLines={1}>
          {product.Shop?.name || "Shop Name"}
        </Text>
        
        <Text className="text-sm font-poppins-semibold text-gray-900 mb-1" numberOfLines={2}>
          {product.title}
        </Text>
        
        {/* Rating */}
        <View className="flex-row items-center mb-1">
          <Ionicons name="star" size={10} color="#FCD34D" />
          <Text className="text-xs font-poppins-medium text-gray-700 ml-1">
            {product.ratings || 0}
          </Text>
        </View>
        
        {/* Price */}
        <View className="flex-row items-center mb-1">
          <Text className="text-base font-poppins-bold text-blue-600">
            ${product.sale_price || product.regular_price}
          </Text>
          {product.sale_price && product.regular_price && (
            <Text className="text-xs text-gray-400 line-through ml-1">
              ${product.regular_price}
            </Text>
          )}
        </View>
        
        {/* Sales Count */}
        <Text className="text-xs text-gray-500 font-poppins-medium">
          {product.totalSales || 0} sold
        </Text>
      </View>
    </TouchableOpacity>
  );
}
