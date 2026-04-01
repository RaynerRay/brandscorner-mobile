import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type OrderStatus =
  | "Ordered"
  | "Packed"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  selectedOptions: {
    color: string;
    size: string;
  };
  product?: {
    id: string;
    title: string;
    images: {
      url: string;
    }[];
    sale_price?: number;
    regular_price: number;
  };
}

interface ShippingAddress {
  id: string;
  label: string;
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface CouponCode {
  id: string;
  public_name: string;
  discountType: string;
  discountValue: number;
  discountCode: string;
}

interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  total: number;
  status: string;
  deliveryStatus: OrderStatus;
  items: OrderItem[];
  couponCode?: CouponCode;
  discountAmount?: number;
  shippingAddress?: ShippingAddress;
  shopId: string;
  userId: string;
}

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/order/api/get-order-details/${id}`
      );
      return response.data.order as Order;
    },
    enabled: !!id,
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "Ordered":
        return { bg: "#FEF3C7", text: "#D97706", icon: "time-outline" };
      case "Packed":
        return { bg: "#DBEAFE", text: "#2563EB", icon: "cog-outline" };
      case "Shipped":
        return { bg: "#D1FAE5", text: "#059669", icon: "car-outline" };
      case "Out for Delivery":
        return { bg: "#FEF3C7", text: "#D97706", icon: "bicycle-outline" };
      case "Delivered":
        return {
          bg: "#D1FAE5",
          text: "#059669",
          icon: "checkmark-circle-outline",
        };
      case "Cancelled":
        return { bg: "#FEE2E2", text: "#DC2626", icon: "close-circle-outline" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280", icon: "help-circle-outline" };
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "Ordered":
        return "Ordered";
      case "Packed":
        return "Packed";
      case "Shipped":
        return "Shipped";
      case "Out for Delivery":
        return "Out for Delivery";
      case "Delivered":
        return "Delivered";
      case "Cancelled":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const getStatusDescription = (status: OrderStatus) => {
    switch (status) {
      case "Ordered":
        return "Your order has been placed and is being processed";
      case "Packed":
        return "Your order has been packed and is ready for shipping";
      case "Shipped":
        return "Your order is on its way to you";
      case "Out for Delivery":
        return "Your order is out for local delivery";
      case "Delivered":
        return "Your order has been delivered successfully";
      case "Cancelled":
        return "Your order has been cancelled";
      default:
        return "Order status unknown";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
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
              Order Details
            </Text>
          </View>
        </View>

        {/* Loading State */}
        <View className="flex-1 justify-center items-center">
          <View className="animate-spin">
            <Ionicons name="refresh" size={48} color="#6B7280" />
          </View>
          <Text className="text-gray-500 font-poppins-medium mt-4 text-center text-lg">
            Loading order details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return;
  }

  const statusConfig = getStatusColor(order.deliveryStatus);
  const orderNumber = `#${order.id.slice(-6)}`;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-poppins-bold text-gray-900">
            Order Details
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-4">
          {/* Order Header Card */}
          <View className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border border-gray-100 p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-poppins-bold text-gray-900">{orderNumber}</Text>
              <View
                className="px-4 py-2 rounded-full"
                style={{ backgroundColor: statusConfig.bg }}
              >
                <View className="flex-row items-center">
                  <Ionicons name={statusConfig.icon as any} size={16} color={statusConfig.text} />
                  <Text
                    className="ml-2 font-poppins-semibold text-sm"
                    style={{ color: statusConfig.text }}
                  >
                    {getStatusText(order.deliveryStatus)}
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-gray-600 font-poppins-medium mb-2">
              {getStatusDescription(order.deliveryStatus)}
            </Text>

            <View className="flex-row items-center justify-between pt-4 border-t border-gray-100">
              <View>
                <Text className="text-gray-500 font-poppins-medium text-sm">Order Date</Text>
                <Text className="text-gray-900 font-poppins-semibold">{formatDate(order.createdAt)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-500 font-poppins-medium text-sm">Total Amount</Text>
                <Text className="text-2xl font-poppins-bold text-gray-900">${order.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Order Items */}
          <View className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border border-gray-100 p-6">
            <Text className="text-lg font-poppins-bold text-gray-900 mb-4">Order Items</Text>
            
            <View className="gap-4">
              {order.items.map((item, index) => (
                <View key={item.id} className={`flex-row items-center ${index !== 0 ? "pt-4 border-t border-gray-100" : ""}`}>
                  <Image
                    source={{ 
                      uri: item.product?.images?.[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop"
                    }}
                    className="w-20 h-20 rounded-lg bg-gray-100"
                    resizeMode="cover"
                  />
                  <View className="flex-1 ml-4">
                    <Text className="text-gray-900 font-poppins-semibold" numberOfLines={2}>
                      {item.product?.title || `Product ${item.productId.slice(-6)}`}
                    </Text>
                    <Text className="text-gray-500 font-poppins-medium text-sm mt-1">
                      Qty: {item.quantity} • ${item.price.toFixed(2)}
                    </Text>
                    {(item?.selectedOptions?.color || item?.selectedOptions?.size) && (
                      <Text className="text-gray-400 font-poppins-medium text-xs mt-1">
                        {[item?.selectedOptions?.size, item?.selectedOptions?.color].filter(Boolean).join(' • ')}
                      </Text>
                    )}
                  </View>
                  <View className="items-end">
                    <Text className="text-gray-900 font-poppins-bold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <View className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border border-gray-100 p-6">
              <Text className="text-lg font-poppins-bold text-gray-900 mb-4">Shipping Address</Text>
              
              <View className="gap-2">
                <Text className="text-gray-900 font-poppins-semibold">{order.shippingAddress.name}</Text>
                <Text className="text-gray-600 font-poppins-medium">{order.shippingAddress.street}</Text>
                <Text className="text-gray-600 font-poppins-medium">
                  {order.shippingAddress.city}, {order.shippingAddress.zip}
                </Text>
                <Text className="text-gray-600 font-poppins-medium">{order.shippingAddress.country}</Text>
              </View>
            </View>
          )}

          {/* Order Summary */}
          <View className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border border-gray-100 p-6">
            <Text className="text-lg font-poppins-bold text-gray-900 mb-4">Order Summary</Text>
            
            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600 font-poppins-medium">Subtotal</Text>
                <Text className="text-gray-900 font-poppins-semibold">
                  ${(order.total + (order.discountAmount || 0)).toFixed(2)}
                </Text>
              </View>
              
              {order.discountAmount && order.discountAmount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600 font-poppins-medium">
                    {order.couponCode?.public_name || 'Discount'}
                  </Text>
                  <Text className="text-green-600 font-poppins-semibold">
                    -${order.discountAmount.toFixed(2)}
                  </Text>
                </View>
              )}
              
              <View className="flex-row justify-between pt-3 border-t border-gray-100">
                <Text className="text-lg font-poppins-bold text-gray-900">Total</Text>
                <Text className="text-lg font-poppins-bold text-gray-900">${order.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
