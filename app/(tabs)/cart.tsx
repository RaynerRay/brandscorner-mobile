import { useStore } from "@/store";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

interface Address {
  id: string;
  name: string;
  label: "Home" | "Work" | "Other";
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
  userId: string;
  createdAt: string;
}

export default function Cart() {
  const { cart, removeFromCart, addToCart } = useStore();
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [storedCouponCode, setStoredCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState("");

  // Fetch shipping addresses
  const { data: addressesData } = useQuery({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(
          "/auth/api/shipping-addresses"
        );
        return response.data.addresses || [];
      } catch (error) {
        console.error("Error fetching addresses:", error);
        return [];
      }
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addresses: Address[] = addressesData || [];

  // Set default address if none selected
  React.useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      const defaultAddress =
        addresses.find((addr) => addr.isDefault) || addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [addresses, selectedAddress]);

  const handleRemoveFromCart = (productId: string) => {
    removeFromCart(productId, null, null, "Mobile App");
    toast.success("Removed from cart");
  };

  const handleUpdateQuantity = (product: any, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(product.id);
      return;
    }

    // Remove the current item and add it back with new quantity
    removeFromCart(product.id, null, null, "Mobile App");
    addToCart(
      {
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        image: product.image,
        shopId: product.shopId,
        quantity: newQuantity,
      },
      null,
      null,
      "Mobile App"
    );
  };

  const handleProductPress = (product: any) => {
    router.push({
      pathname: "/(routes)/product/[id]",
      params: {
        id: product.slug,
      },
    });
  };

  const couponCodeApplyHandler = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const response = await axiosInstance.post("/order/api/verify-coupon", {
        couponCode: couponCode.trim(),
        cart: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity || 1,
          sale_price: item.price,
          shopId: item.shopId,
        })),
      });

      const { discountAmount: discount, couponCode: validCouponCode } =
        response.data;

      setDiscountAmount(discount);
      setStoredCouponCode(validCouponCode);
      setCouponError("");
      toast.success(
        `Coupon "${validCouponCode}" applied! Save: $${discount.toFixed(2)}`
      );
    } catch (error: any) {
      console.error("Coupon verification error:", error);
      setCouponError(error.response?.data?.message || "Invalid coupon code");
      setDiscountAmount(0);
      setStoredCouponCode("");
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce(
      (total, item) => total + item.price * (item.quantity || 1),
      0
    );
  };

  const subtotal = calculateSubtotal();
  const total = subtotal; // Add shipping, taxes, etc. here if needed

  if (cart.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Header */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-2xl font-poppins-bold text-gray-900">
            Shopping Cart
          </Text>
          <Text className="text-sm text-gray-500 font-poppins-medium mt-1">
            Home • Cart
          </Text>
        </View>

        {/* Empty State */}
        <View className="flex-1 justify-center items-center px-4">
          <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="bag-outline" size={48} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-poppins-bold text-gray-900 mb-2">
            Your cart is empty
          </Text>
          <Text className="text-gray-500 text-center font-poppins-medium mb-8">
            Start shopping to add items to your cart
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
          Shopping Cart
        </Text>
        <Text className="text-sm text-gray-500 font-poppins-medium mt-1">
          Home • Cart
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View className="px-4 py-6">
          {cart.map((product, index) => (
            <View
              key={product.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-4 overflow-hidden"
            >
              <View className="p-4">
                <View className="flex-row">
                  {/* Product Image */}
                  <TouchableOpacity
                    className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden mr-4"
                    onPress={() => handleProductPress(product)}
                  >
                    <Image
                      source={{
                        uri:
                          product.image ||
                          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&crop=center",
                      }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  {/* Product Details */}
                  <View className="flex-1">
                    <TouchableOpacity
                      onPress={() => handleProductPress(product)}
                    >
                      <Text
                        className="text-lg font-poppins-semibold text-gray-900 mb-2"
                        numberOfLines={2}
                      >
                        {product.title}
                      </Text>
                    </TouchableOpacity>

                    {/* Price */}
                    <Text className="text-xl font-poppins-bold text-blue-600 mb-4">
                      ${product.price}
                    </Text>

                    {/* Quantity and Remove */}
                    <View className="flex-row items-center justify-between">
                      {/* Quantity Selector */}
                      <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdateQuantity(
                              product,
                              (product.quantity || 1) - 1
                            )
                          }
                          className="w-8 h-8 bg-white rounded-full items-center justify-center"
                        >
                          <Ionicons name="remove" size={16} color="#6B7280" />
                        </TouchableOpacity>
                        <Text className="mx-4 text-lg font-poppins-semibold text-gray-900">
                          {product.quantity || 1}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdateQuantity(
                              product,
                              (product.quantity || 1) + 1
                            )
                          }
                          className="w-8 h-8 bg-white rounded-full items-center justify-center"
                        >
                          <Ionicons name="add" size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>

                      {/* Remove Button */}
                      <TouchableOpacity
                        className="px-4 py-2"
                        onPress={() => handleRemoveFromCart(product.id)}
                      >
                        <View className="flex-row items-center">
                          <Ionicons name="close" size={16} color="#EF4444" />
                          <Text className="text-red-500 font-poppins-medium ml-1">
                            Remove
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View className="px-4 pb-6">
          <View className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <Text className="text-xl font-poppins-bold text-gray-900 mb-6">
              Order Summary
            </Text>

            {/* Subtotal */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-600 font-poppins-medium">
                Subtotal
              </Text>
              <Text className="text-lg font-poppins-bold text-gray-900">
                ${subtotal.toFixed(2)}
              </Text>
            </View>

            {/* Coupon Section */}
            <View className="mb-6">
              <Text className="text-lg font-poppins-semibold text-gray-900 mb-3">
                Have a Coupon?
              </Text>
              <View className="flex-row">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 mr-3 font-poppins-medium"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChangeText={setCouponCode}
                />
                <TouchableOpacity
                  className="bg-blue-600 px-6 py-3 rounded-lg"
                  onPress={couponCodeApplyHandler}
                >
                  <Text className="text-white font-poppins-semibold">
                    Apply
                  </Text>
                </TouchableOpacity>
              </View>
              {couponError ? (
                <Text className="text-red-500 font-poppins-medium text-sm mt-2">
                  {couponError}
                </Text>
              ) : storedCouponCode ? (
                <Text className="text-green-600 font-poppins-medium text-sm mt-2">
                  Coupon &quot;{storedCouponCode}&quot; applied! Save: $
                  {discountAmount.toFixed(2)}
                </Text>
              ) : null}
            </View>

            {/* Shipping Address */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-poppins-semibold text-gray-900">
                  Select Shipping Address
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(routes)/shipping")}
                  className="px-3 py-1"
                >
                  <Text className="text-blue-600 font-poppins-medium text-sm">
                    Manage
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                className="border border-gray-300 rounded-lg px-4 py-3"
                onPress={() => setShowAddressModal(true)}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-poppins-medium text-gray-900">
                    {selectedAddress
                      ? `${selectedAddress.name} — ${selectedAddress.city}, ${selectedAddress.country}`
                      : "Select shipping address"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Total */}
            <View className="flex-row justify-between items-center mb-6 pt-4 border-t border-gray-200">
              <Text className="text-xl font-poppins-bold text-gray-900">
                Total
              </Text>
              <Text className="text-2xl font-poppins-bold text-gray-900">
                ${total.toFixed(2)}
              </Text>
            </View>

            {/* Proceed to Checkout */}
            <TouchableOpacity
              className="bg-gray-900 py-4 rounded-xl"
              onPress={async () => {
                if (!selectedAddress) {
                  toast.error("Please select a shipping address");
                  return;
                }

                try {
                  // Create payment session first
                  const sessionResponse = await axiosInstance.post(
                    "/order/api/create-payment-session",
                    {
                      cart: cart.map((item) => ({
                        id: item.id,
                        quantity: item.quantity || 1,
                        sale_price: item.price,
                        shopId: item.shopId,
                      })),
                      selectedAddressId: selectedAddress.id,
                      coupon: storedCouponCode
                        ? { code: storedCouponCode, discountAmount }
                        : null,
                    }
                  );

                  const { sessionId } = sessionResponse.data;

                  // Navigate to payment screen with session ID
                  router.push({
                    pathname: "/(routes)/payment",
                    params: { sessionId },
                  });
                } catch (error) {
                  console.error("Error creating payment session:", error);
                  toast.error(
                    "Failed to create payment session. Please try again."
                  );
                }
              }}
              disabled={!selectedAddress}
            >
              <Text className="text-white font-poppins-semibold text-lg text-center">
                {!selectedAddress
                  ? "Select Address First"
                  : "Proceed to Checkout"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-20" />
      </ScrollView>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <Text className="text-xl font-poppins-bold text-gray-900">
              Select Shipping Address
            </Text>
            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 p-4"
            showsVerticalScrollIndicator={false}
          >
            {addresses.length === 0 ? (
              <View className="flex-1 justify-center items-center py-20">
                <Ionicons name="location-outline" size={64} color="#9CA3AF" />
                <Text className="text-gray-500 font-poppins-medium mt-4 text-center text-lg">
                  No addresses found
                </Text>
                <Text className="text-gray-400 font-poppins-medium text-center mt-2">
                  Add a shipping address to continue
                </Text>
                <TouchableOpacity
                  className="bg-blue-600 px-6 py-3 rounded-xl mt-6"
                  onPress={() => {
                    setShowAddressModal(false);
                    router.push("/(routes)/shipping");
                  }}
                >
                  <Text className="text-white font-poppins-semibold">
                    Add Address
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Address List */}
                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    className={`bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border border-gray-100 mb-4 overflow-hidden ${
                      selectedAddress?.id === address.id
                        ? "border-blue-500 bg-blue-50"
                        : ""
                    }`}
                    onPress={() => {
                      setSelectedAddress(address);
                      setShowAddressModal(false);
                    }}
                  >
                    <View className="p-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                          <Ionicons
                            name={
                              address.label === "Home"
                                ? "home-outline"
                                : address.label === "Work"
                                ? "business-outline"
                                : "location-outline"
                            }
                            size={20}
                            color={
                              address.label === "Home"
                                ? "#2563EB"
                                : address.label === "Work"
                                ? "#059669"
                                : "#6B7280"
                            }
                          />
                          <Text className="text-lg font-poppins-semibold text-gray-900 ml-2">
                            {address.name}
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          {address.isDefault && (
                            <View className="bg-blue-100 px-3 py-1 rounded-full mr-2">
                              <Text className="text-blue-700 font-poppins-medium text-sm">
                                Default
                              </Text>
                            </View>
                          )}
                          <View
                            className="px-3 py-1 rounded-full"
                            style={{
                              backgroundColor:
                                address.label === "Home"
                                  ? "#DBEAFE"
                                  : address.label === "Work"
                                  ? "#D1FAE5"
                                  : "#F3F4F6",
                            }}
                          >
                            <Text
                              className="font-poppins-medium text-sm capitalize"
                              style={{
                                color:
                                  address.label === "Home"
                                    ? "#2563EB"
                                    : address.label === "Work"
                                    ? "#059669"
                                    : "#6B7280",
                              }}
                            >
                              {address.label}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text className="text-gray-700 font-poppins-medium mb-1">
                        {address.street}
                      </Text>
                      <Text className="text-gray-700 font-poppins-medium mb-1">
                        {address.city}, {address.zip}
                      </Text>
                      <Text className="text-gray-700 font-poppins-medium">
                        {address.country}
                      </Text>

                      {selectedAddress?.id === address.id && (
                        <View className="mt-3 pt-3 border-t border-gray-200">
                          <View className="flex-row items-center justify-center">
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color="#2563EB"
                            />
                            <Text className="text-blue-600 font-poppins-semibold ml-2">
                              Selected
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Add New Address */}
                <TouchableOpacity
                  className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border-2 border-dashed border-gray-300 p-6 items-center"
                  onPress={() => {
                    setShowAddressModal(false);
                    router.push("/(routes)/shipping");
                  }}
                  activeOpacity={0.7}
                >
                  <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-3">
                    <Ionicons name="add" size={24} color="#2563EB" />
                  </View>
                  <Text className="text-gray-900 font-poppins-semibold text-lg">
                    Add New Address
                  </Text>
                  <Text className="text-gray-500 font-poppins-medium text-center mt-1">
                    Add a new shipping address
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Bottom Spacing */}
            <View className="h-20" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
