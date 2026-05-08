import { useStore } from "@/store";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
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

// ── Constants ─────────────────────────────────────────────────────────────────
const WHATSAPP_BUSINESS_NUMBER = "263717116953";

const COLLECTION_POINTS = [
  {
    id: "skyline",
    name: "Skyline Mall",
    address: "Shop 9, Corner Robert Mugabe & Inez Terrace",
    city: "Harare CBD",
  },
  {
    id: "chinhoyi",
    name: "Chinhoyi Mall",
    address: "Shop B15, Corner Chinhoyi Street & Albion Street",
    city: "Harare CBD",
  },
];

type FulfillmentType = "delivery" | "collection";
type PaymentMethod = "cash_on_delivery" | "mobile_payment" | "online";

// ── Checkout Sheet ────────────────────────────────────────────────────────────

interface CheckoutSheetProps {
  visible: boolean;
  onClose: () => void;
  cart: any[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  discountedProductId: string;
  storedCouponCode: string;
  selectedAddress: Address | null;
  onOrderPlaced: () => void;
}

function CheckoutSheet({
  visible,
  onClose,
  cart,
  subtotal,
  discountAmount,
  discountPercent,
  discountedProductId,
  storedCouponCode,
  selectedAddress,
  onOrderPlaced,
}: CheckoutSheetProps) {
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [selectedPoint, setSelectedPoint] = useState(COLLECTION_POINTS[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sent, setSent] = useState(false);

  const total = subtotal - discountAmount;

  const buildWhatsAppMessage = () => {
    const lines: string[] = [];
    lines.push("🛍️ *New Order Request*");
    lines.push("━━━━━━━━━━━━━━━━━━━━━");

    cart.forEach((item, i) => {
      const isDiscounted = item.id === discountedProductId;
      const unitPrice = isDiscounted
        ? (item.price * (100 - discountPercent)) / 100
        : item.price;
      lines.push(`${i + 1}. *${item.title}*`);
      lines.push(
        `   Qty: ${item.quantity || 1} × $${unitPrice.toFixed(2)} = *$${(unitPrice * (item.quantity || 1)).toFixed(2)}*` +
          (isDiscounted ? ` _(${discountPercent}% off)_` : "")
      );
    });

    lines.push("━━━━━━━━━━━━━━━━━━━━━");
    if (discountAmount > 0)
      lines.push(`🏷️ Coupon *${storedCouponCode}*: -$${discountAmount.toFixed(2)}`);
    lines.push(`🛒 Items Total: $${total.toFixed(2)}`);

    if (fulfillment === "delivery") {
      lines.push("━━━━━━━━━━━━━━━━━━━━━");
      lines.push("🚚 *Delivery*");
      if (selectedAddress) {
        lines.push(`📦 *Deliver to:* ${selectedAddress.name}`);
        lines.push(`   ${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.zip}`);
        lines.push(`   ${selectedAddress.country}`);
      }
      lines.push(`🚗 Delivery fee: to be confirmed`);
      lines.push(`💰 *Order Total (excl. delivery): $${total.toFixed(2)}*`);
    } else {
      const point = COLLECTION_POINTS.find((p) => p.id === selectedPoint)!;
      lines.push("━━━━━━━━━━━━━━━━━━━━━");
      lines.push("🏪 *Collection*");
      lines.push(`   ${point.name}`);
      lines.push(`   ${point.address}, ${point.city}`);
      lines.push(`💰 *Order Total: $${total.toFixed(2)}*`);
    }

    lines.push("━━━━━━━━━━━━━━━━━━━━━");
    lines.push(
      `💳 *Payment:* ${paymentMethod === "cash_on_delivery" ? "Cash on Delivery 💵" : "Mobile Payment 📱"}`
    );
    lines.push("━━━━━━━━━━━━━━━━━━━━━");
    lines.push("Please confirm my order. Thank you! 🙏");
    return lines.join("\n");
  };

  const handleWhatsAppOrder = async () => {
    if (fulfillment === "delivery" && !selectedAddress) {
      toast.error("Please select a delivery address first.");
      return;
    }

    setIsProcessing(true);
    try {
      const collectionPoint =
        fulfillment === "collection"
          ? COLLECTION_POINTS.find((p) => p.id === selectedPoint)
          : null;

      const res = await axiosInstance.post("/order/api/create-order", {
        cart: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity || 1,
          sale_price: item.price,
          shopId: item.shopId,
          title: item.title,
        })),
        status: "pending",
        paymentMethod,
        fulfillmentType: fulfillment,
        ...(fulfillment === "delivery" && {
          shippingAddressId: selectedAddress?.id,
          estimatedDeliveryFee: 0,
          isHarareDelivery: false,
        }),
        ...(fulfillment === "collection" && {
          collectionPoint: collectionPoint
            ? { id: collectionPoint.id, name: collectionPoint.name, address: collectionPoint.address }
            : null,
        }),
        coupon: {
          code: storedCouponCode,
          discountAmount,
          discountPercent,
          discountedProductId,
        },
        total,
      });

      if (res.data?.order?.id) onOrderPlaced();

      const msg = encodeURIComponent(buildWhatsAppMessage());
      await Linking.openURL(`https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${msg}`);
      setSent(true);
    } catch {
      toast.error("Could not place your order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address first.");
      return;
    }

    setIsProcessing(true);
    try {
      const sessionResponse = await axiosInstance.post("/order/api/create-payment-session", {
        cart: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity || 1,
          sale_price: item.price,
          shopId: item.shopId,
        })),
        selectedAddressId: selectedAddress.id,
        coupon: storedCouponCode ? { code: storedCouponCode, discountAmount } : null,
      });
      const { sessionId } = sessionResponse.data;
      onClose();
      router.push({ pathname: "/(routes)/payment", params: { sessionId } });
    } catch {
      toast.error("Failed to create payment session. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === "online") {
      handleOnlinePayment();
    } else {
      handleWhatsAppOrder();
    }
  };

  const point = COLLECTION_POINTS.find((p) => p.id === selectedPoint)!;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
          <Text className="text-xl font-poppins-bold text-gray-900">Review & Place Order</Text>
          {!sent && (
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Items */}
          <View className="px-4 py-4 border-b border-gray-100">
            {cart.map((item) => {
              const isDiscounted = item.id === discountedProductId;
              const unitPrice = isDiscounted
                ? (item.price * (100 - discountPercent)) / 100
                : item.price;
              return (
                <View key={item.id} className="flex-row items-center mb-3">
                  <Image
                    source={{
                      uri: item.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
                    }}
                    className="w-12 h-12 rounded-xl border border-gray-100 mr-3"
                    resizeMode="cover"
                  />
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-poppins-semibold text-gray-900" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-xs text-gray-400 font-poppins-medium">Qty {item.quantity || 1}</Text>
                  </View>
                  <View className="items-end">
                    {isDiscounted && (
                      <Text className="text-xs text-gray-400 line-through font-poppins-medium">
                        ${(item.price * (item.quantity || 1)).toFixed(2)}
                      </Text>
                    )}
                    <Text className={`text-sm font-poppins-semibold ${isDiscounted ? "text-green-600" : "text-gray-800"}`}>
                      ${(unitPrice * (item.quantity || 1)).toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {!sent ? (
            <View className="px-4 py-4">
              {/* Fulfillment selector */}
              <View className="mb-5">
                <Text className="text-sm font-poppins-semibold text-gray-700 mb-2">
                  How would you like to receive your order?
                </Text>
                <View className="flex-row bg-gray-100 rounded-xl p-1">
                  <TouchableOpacity
                    className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg mr-1 ${fulfillment === "delivery" ? "bg-gray-900" : "bg-transparent"}`}
                    onPress={() => setFulfillment("delivery")}
                  >
                    <Ionicons name="car-outline" size={16} color={fulfillment === "delivery" ? "#fff" : "#6B7280"} />
                    <Text className={`ml-1.5 text-sm font-poppins-semibold ${fulfillment === "delivery" ? "text-white" : "text-gray-600"}`}>
                      Delivery
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${fulfillment === "collection" ? "bg-gray-900" : "bg-transparent"}`}
                    onPress={() => setFulfillment("collection")}
                  >
                    <Ionicons name="storefront-outline" size={16} color={fulfillment === "collection" ? "#fff" : "#6B7280"} />
                    <Text className={`ml-1.5 text-sm font-poppins-semibold ${fulfillment === "collection" ? "text-white" : "text-gray-600"}`}>
                      Collect
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Delivery address */}
              {fulfillment === "delivery" && (
                <View className="mb-5">
                  {selectedAddress ? (
                    <View className="flex-row items-start bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <Ionicons name="location-outline" size={16} color="#9CA3AF" style={{ marginTop: 2 }} />
                      <View className="ml-2 flex-1">
                        <Text className="text-sm font-poppins-semibold text-gray-900">{selectedAddress.name}</Text>
                        <Text className="text-xs text-gray-500 font-poppins-medium">
                          {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.country}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                      <Text className="text-sm text-amber-600 font-poppins-medium">
                        ⚠️ No delivery address selected. Go back and add one.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Collection point selection */}
              {fulfillment === "collection" && (
                <View className="mb-5">
                  <Text className="text-xs text-gray-500 font-poppins-medium mb-2">
                    Choose your nearest collection point —{" "}
                    <Text className="text-green-600 font-poppins-semibold">FREE</Text>
                  </Text>
                  {COLLECTION_POINTS.map((pt) => (
                    <TouchableOpacity
                      key={pt.id}
                      className={`border-2 rounded-xl p-3 mb-2 ${selectedPoint === pt.id ? "border-gray-900 bg-gray-50" : "border-gray-200"}`}
                      onPress={() => setSelectedPoint(pt.id)}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-start">
                        <View
                          className={`w-4 h-4 rounded-full border-2 mt-0.5 items-center justify-center mr-2 ${selectedPoint === pt.id ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}
                        >
                          {selectedPoint === pt.id && (
                            <View className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-poppins-semibold text-gray-900">{pt.name}</Text>
                          <Text className="text-xs text-gray-500 font-poppins-medium">{pt.address}</Text>
                          <Text className="text-xs text-gray-400 font-poppins-medium">{pt.city}</Text>
                        </View>
                        <Ionicons
                          name="bag-outline"
                          size={20}
                          color={selectedPoint === pt.id ? "#111827" : "#D1D5DB"}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Payment method */}
              <View className="mb-5">
                <Text className="text-sm font-poppins-semibold text-gray-700 mb-2">How will you pay?</Text>
                {(
                  [
                    { value: "cash_on_delivery", emoji: "💵", label: "Cash on Delivery" },
                    { value: "mobile_payment", emoji: "📱", label: "Mobile Payment" },
                    { value: "online", emoji: "💳", label: "Online (Card)" },
                  ] as { value: PaymentMethod; emoji: string; label: string }[]
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    className={`border-2 rounded-xl p-3 flex-row items-center mb-2 ${paymentMethod === opt.value ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    onPress={() => setPaymentMethod(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text className="text-2xl mr-3">{opt.emoji}</Text>
                    <Text className={`text-sm font-poppins-semibold flex-1 ${paymentMethod === opt.value ? "text-blue-700" : "text-gray-700"}`}>
                      {opt.label}
                    </Text>
                    {paymentMethod === opt.value && (
                      <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            /* Success state for WhatsApp orders */
            <View className="items-center px-6 py-10">
              <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="checkmark" size={32} color="#059669" />
              </View>
              <Text className="text-xl font-poppins-bold text-gray-900 text-center mb-2">
                Order sent to WhatsApp!
              </Text>
              <Text className="text-sm text-gray-500 font-poppins-medium text-center mb-6">
                {fulfillment === "collection"
                  ? `We'll have your order ready at ${point.name}. Check WhatsApp for collection details.`
                  : "We'll confirm your order shortly. Check WhatsApp for updates."}
              </Text>
              <TouchableOpacity
                className="w-full py-3 rounded-xl bg-gray-100 items-center"
                onPress={onClose}
              >
                <Text className="text-sm font-poppins-semibold text-gray-700">Done</Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="h-10" />
        </ScrollView>

        {/* Footer — totals + CTA */}
        {!sent && (
          <View className="border-t border-gray-100 px-4 pt-4 pb-6">
            <View className="bg-gray-50 rounded-xl p-3 mb-4">
              {discountAmount > 0 && (
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-500 font-poppins-medium">
                    Coupon <Text className="text-gray-700 font-poppins-semibold">{storedCouponCode}</Text>
                  </Text>
                  <Text className="text-sm text-green-600 font-poppins-semibold">
                    −${discountAmount.toFixed(2)}
                  </Text>
                </View>
              )}
              {fulfillment === "delivery" && (
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-500 font-poppins-medium">Delivery fee</Text>
                  <Text className="text-sm text-gray-700 font-poppins-medium">TBC</Text>
                </View>
              )}
              <View className="flex-row justify-between pt-2 border-t border-gray-200 mt-1">
                <Text className="text-base font-poppins-bold text-gray-900">Total</Text>
                <Text className="text-base font-poppins-bold text-gray-900">
                  ${total.toFixed(2)}{fulfillment === "delivery" ? " + delivery" : ""}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className={`w-full py-4 rounded-xl flex-row items-center justify-center ${isProcessing ? "bg-gray-400" : paymentMethod === "online" ? "bg-blue-600" : "bg-[#25D366]"}`}
              onPress={handlePlaceOrder}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name={paymentMethod === "online" ? "card-outline" : "logo-whatsapp"}
                  size={20}
                  color="#fff"
                />
              )}
              <Text className="text-white font-poppins-semibold text-base ml-2">
                {isProcessing
                  ? "Processing..."
                  : paymentMethod === "online"
                  ? `Pay $${total.toFixed(2)} Online`
                  : "Place Order via WhatsApp"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ── Cart Screen ───────────────────────────────────────────────────────────────

export default function Cart() {
  const { cart, removeFromCart, addToCart, clearCart } = useStore();
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [inlineAddress, setInlineAddress] = useState({
    label: "Home" as "Home" | "Work" | "Other",
    name: "", street: "", city: "", zip: "", country: "Zimbabwe",
    isDefault: true,
  });
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [savedInlineAddress, setSavedInlineAddress] = useState<Address | null>(null);
  const [storedCouponCode, setStoredCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountedProductId, setDiscountedProductId] = useState("");
  const [couponError, setCouponError] = useState("");
  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false);

  // Fetch shipping addresses
  const { data: addressesData, isFetched: addressesFetched } = useQuery({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/auth/api/shipping-addresses");
        return response.data.addresses || [];
      } catch (error) {
        console.error("Error fetching addresses:", error);
        return [];
      }
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addresses: Address[] = addressesData || [];

  // Auto-select default address; open inline form when no addresses exist
  React.useEffect(() => {
    if (!addressesFetched) return;
    if (addresses.length === 0) {
      setShowAddressForm(true);
    } else if (!selectedAddress) {
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      if (defaultAddress) setSelectedAddress(defaultAddress);
    }
  }, [addresses, selectedAddress, addressesFetched]);

  const handleRemoveFromCart = (productId: string) => {
    removeFromCart(productId, null, null, "Mobile App");
    toast.success("Removed from cart");
  };

  const handleUpdateQuantity = (product: any, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(product.id);
      return;
    }

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
      params: { id: product.slug },
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

      const {
        discountAmount: discount,
        couponCode: validCouponCode,
        discount: percent,
        discountedProductId: productId,
      } = response.data;

      setDiscountAmount(discount);
      setStoredCouponCode(validCouponCode);
      setDiscountPercent(percent || 0);
      setDiscountedProductId(productId || "");
      setCouponError("");
      toast.success(`Coupon "${validCouponCode}" applied! Save: $${discount.toFixed(2)}`);
    } catch (error: any) {
      console.error("Coupon verification error:", error);
      setCouponError(error.response?.data?.message || "Invalid coupon code");
      setDiscountAmount(0);
      setDiscountPercent(0);
      setDiscountedProductId("");
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

  const handleProceedToCheckout = async () => {
    let addressToUse: Address | null = selectedAddress ?? savedInlineAddress;

    if (showAddressForm) {
      const { name, street, city, zip, country } = inlineAddress;
      const isFormComplete = !!(name.trim() && street.trim() && city.trim() && zip.trim() && country.trim());

      if (isFormComplete) {
        setIsSubmittingAddress(true);
        try {
          const res = await axiosInstance.post("/auth/api/add-address", { ...inlineAddress });
          addressToUse = res.data.address;
          queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
          setSelectedAddress(addressToUse);
          setSavedInlineAddress(addressToUse);
          setShowAddressForm(false);
          setInlineAddress({ label: "Home", name: "", street: "", city: "", zip: "", country: "Zimbabwe", isDefault: true });
        } catch {
          toast.error("Failed to save address. Please try again.");
          setIsSubmittingAddress(false);
          return;
        }
        setIsSubmittingAddress(false);
      }
    }

    setShowCheckoutSheet(true);
  };

  const handleOrderPlaced = () => {
    clearCart();
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-2xl font-poppins-bold text-gray-900">
            Shopping Cart
          </Text>
          <Text className="text-sm text-gray-500 font-poppins-medium mt-1">
            Home • Cart
          </Text>
        </View>

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
          {cart.map((product) => (
            <View
              key={product.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-4 overflow-hidden"
            >
              <View className="p-4">
                <View className="flex-row">
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

                  <View className="flex-1">
                    <TouchableOpacity onPress={() => handleProductPress(product)}>
                      <Text
                        className="text-lg font-poppins-semibold text-gray-900 mb-2"
                        numberOfLines={2}
                      >
                        {product.title}
                      </Text>
                    </TouchableOpacity>

                    <Text className="text-xl font-poppins-bold text-blue-600 mb-4">
                      ${product.price}
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                        <TouchableOpacity
                          onPress={() => handleUpdateQuantity(product, (product.quantity || 1) - 1)}
                          className="w-8 h-8 bg-white rounded-full items-center justify-center"
                        >
                          <Ionicons name="remove" size={16} color="#6B7280" />
                        </TouchableOpacity>
                        <Text className="mx-4 text-lg font-poppins-semibold text-gray-900">
                          {product.quantity || 1}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleUpdateQuantity(product, (product.quantity || 1) + 1)}
                          className="w-8 h-8 bg-white rounded-full items-center justify-center"
                        >
                          <Ionicons name="add" size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        className="px-4 py-2"
                        onPress={() => handleRemoveFromCart(product.id)}
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

        {/* Order Summary */}
        <View className="px-4 pb-6">
          <View className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <Text className="text-xl font-poppins-bold text-gray-900 mb-6">
              Order Summary
            </Text>

            {/* Subtotal */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-600 font-poppins-medium">Subtotal</Text>
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
                  <Text className="text-white font-poppins-semibold">Apply</Text>
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
                  Delivery Address
                </Text>
                {(selectedAddress || savedInlineAddress) && !showAddressForm && (
                  <TouchableOpacity onPress={() => setShowAddressForm(true)} className="px-3 py-1">
                    <Text className="text-blue-600 font-poppins-medium text-sm">+ Add new</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Selected address card */}
              {!showAddressForm && (selectedAddress ?? savedInlineAddress) && (
                <View className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center mb-1">
                        <View className={`px-2 py-0.5 rounded-full mr-2 ${
                          (selectedAddress ?? savedInlineAddress)!.label === "Home" ? "bg-blue-100" :
                          (selectedAddress ?? savedInlineAddress)!.label === "Work" ? "bg-green-100" : "bg-gray-100"
                        }`}>
                          <Text className={`text-xs font-poppins-semibold ${
                            (selectedAddress ?? savedInlineAddress)!.label === "Home" ? "text-blue-700" :
                            (selectedAddress ?? savedInlineAddress)!.label === "Work" ? "text-green-700" : "text-gray-600"
                          }`}>{(selectedAddress ?? savedInlineAddress)!.label}</Text>
                        </View>
                        {(selectedAddress ?? savedInlineAddress)!.isDefault && (
                          <Text className="text-xs text-gray-400 font-poppins-medium">Default</Text>
                        )}
                      </View>
                      <Text className="text-sm font-poppins-semibold text-gray-900">
                        {(selectedAddress ?? savedInlineAddress)!.name}
                      </Text>
                      <Text className="text-xs text-gray-500 font-poppins-medium mt-0.5">
                        {(selectedAddress ?? savedInlineAddress)!.street}, {(selectedAddress ?? savedInlineAddress)!.city}
                      </Text>
                    </View>
                    {addresses.length > 1 && (
                      <TouchableOpacity onPress={() => setShowAddressModal(true)} className="py-1">
                        <Text className="text-blue-600 font-poppins-medium text-sm">Change</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* Has saved addresses but none selected */}
              {!showAddressForm && !(selectedAddress ?? savedInlineAddress) && addresses.length > 0 && (
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => setShowAddressModal(true)}
                    className="flex-1 flex-row items-center justify-center border border-gray-200 rounded-xl py-3 px-3 mr-2"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                    <Text className="text-gray-700 font-poppins-medium text-sm ml-1.5">Select saved address</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowAddressForm(true)}
                    className="border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color="#9CA3AF" />
                    <Text className="text-gray-400 font-poppins-medium text-xs">New</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* No addresses at all */}
              {!showAddressForm && !(selectedAddress ?? savedInlineAddress) && addresses.length === 0 && addressesFetched && (
                <TouchableOpacity
                  onPress={() => setShowAddressForm(true)}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex-row items-center"
                  activeOpacity={0.7}
                >
                  <View className="w-9 h-9 bg-blue-50 rounded-full items-center justify-center mr-3">
                    <Ionicons name="add" size={20} color="#2563EB" />
                  </View>
                  <Text className="text-gray-500 font-poppins-medium text-sm">Add delivery address</Text>
                </TouchableOpacity>
              )}

              {/* Inline address form */}
              {showAddressForm && (
                <View className="border border-blue-100 rounded-xl p-4 bg-blue-50/30">
                  <Text className="text-xs text-gray-400 font-poppins-medium mb-3">
                    Saved automatically when you place your order
                  </Text>
                  <View className="flex-row mb-3">
                    {(["Home", "Work", "Other"] as const).map((lbl) => (
                      <TouchableOpacity
                        key={lbl}
                        onPress={() => setInlineAddress(prev => ({ ...prev, label: lbl }))}
                        className={`flex-1 py-2 rounded-xl border-2 items-center mr-1 last:mr-0 ${
                          inlineAddress.label === lbl ? "border-gray-900 bg-gray-900" : "border-gray-200 bg-white"
                        }`}
                      >
                        <Text className={`font-poppins-semibold text-xs ${
                          inlineAddress.label === lbl ? "text-white" : "text-gray-600"
                        }`}>{lbl}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 font-poppins-medium text-gray-900 bg-white mb-3"
                    placeholder="Full name *"
                    value={inlineAddress.name}
                    onChangeText={(val) => setInlineAddress(prev => ({ ...prev, name: val }))}
                  />
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 font-poppins-medium text-gray-900 bg-white mb-3"
                    placeholder="Street address *"
                    value={inlineAddress.street}
                    onChangeText={(val) => setInlineAddress(prev => ({ ...prev, street: val }))}
                  />
                  <View className="flex-row mb-3">
                    <TextInput
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 font-poppins-medium text-gray-900 bg-white mr-3"
                      placeholder="City *"
                      value={inlineAddress.city}
                      onChangeText={(val) => setInlineAddress(prev => ({ ...prev, city: val }))}
                    />
                    <TextInput
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 font-poppins-medium text-gray-900 bg-white"
                      placeholder="ZIP *"
                      value={inlineAddress.zip}
                      onChangeText={(val) => setInlineAddress(prev => ({ ...prev, zip: val }))}
                    />
                  </View>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 font-poppins-medium text-gray-900 bg-white mb-3"
                    placeholder="Country *"
                    value={inlineAddress.country}
                    onChangeText={(val) => setInlineAddress(prev => ({ ...prev, country: val }))}
                  />
                  <TouchableOpacity
                    onPress={() => setInlineAddress(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                    className="flex-row items-center py-2 mb-1"
                    activeOpacity={0.7}
                  >
                    <View className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${
                      inlineAddress.isDefault ? "bg-gray-900 border-gray-900" : "bg-white border-gray-300"
                    }`}>
                      {inlineAddress.isDefault && (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      )}
                    </View>
                    <Text className="text-xs text-gray-500 font-poppins-medium">Set as default address</Text>
                  </TouchableOpacity>
                  {(addresses.length > 0 || savedInlineAddress) && (
                    <TouchableOpacity
                      onPress={() => setShowAddressForm(false)}
                      className="py-2.5 rounded-xl border border-gray-200 items-center mt-1"
                    >
                      <Text className="text-gray-500 font-poppins-medium text-sm">
                        Cancel — use saved address
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Collection point teaser */}
            <View className="mb-5 flex-row items-start bg-gray-50 border border-gray-200 rounded-xl p-3">
              <Ionicons name="storefront-outline" size={16} color="#6B7280" style={{ marginTop: 2 }} />
              <Text className="text-xs text-gray-600 font-poppins-medium flex-1 ml-2">
                Prefer to collect?{" "}
                <Text className="font-poppins-semibold text-gray-800">2 shops in Harare CBD.</Text>
                {" "}Choose collection at checkout.
              </Text>
            </View>

            {/* Total */}
            <View className="flex-row justify-between items-center mb-6 pt-4 border-t border-gray-200">
              <Text className="text-xl font-poppins-bold text-gray-900">Total</Text>
              <Text className="text-2xl font-poppins-bold text-gray-900">
                ${(subtotal - discountAmount).toFixed(2)}
              </Text>
            </View>

            {/* Proceed to Checkout */}
            <TouchableOpacity
              className={`py-4 rounded-xl flex-row items-center justify-center ${isSubmittingAddress ? "bg-gray-500" : "bg-gray-900"}`}
              onPress={handleProceedToCheckout}
              disabled={isSubmittingAddress}
            >
              {isSubmittingAddress ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="bag-check-outline" size={20} color="#fff" />
              )}
              <Text className="text-white font-poppins-semibold text-lg ml-2">
                {isSubmittingAddress ? "Saving address…" : "Proceed to Checkout"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <Text className="text-xl font-poppins-bold text-gray-900">
              Select Shipping Address
            </Text>
            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {addresses.length === 0 ? (
              <View className="flex-1 justify-center items-center py-20">
                <Ionicons name="location-outline" size={64} color="#9CA3AF" />
                <Text className="text-gray-500 font-poppins-medium mt-4 text-center text-lg">
                  No saved addresses
                </Text>
                <Text className="text-gray-400 font-poppins-medium text-center mt-2">
                  Close and fill in your address below
                </Text>
                <TouchableOpacity
                  className="bg-gray-900 px-6 py-3 rounded-xl mt-6"
                  onPress={() => { setShowAddressModal(false); setShowAddressForm(true); }}
                >
                  <Text className="text-white font-poppins-semibold">Add Address</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    className={`border-2 rounded-2xl mb-3 overflow-hidden ${
                      selectedAddress?.id === address.id ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-white"
                    }`}
                    onPress={() => { setSelectedAddress(address); setShowAddressModal(false); }}
                  >
                    <View className="p-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                          <Ionicons
                            name={address.label === "Home" ? "home-outline" : address.label === "Work" ? "business-outline" : "location-outline"}
                            size={18}
                            color={address.label === "Home" ? "#2563EB" : address.label === "Work" ? "#059669" : "#6B7280"}
                          />
                          <Text className="text-base font-poppins-semibold text-gray-900 ml-2">{address.name}</Text>
                        </View>
                        <View className="flex-row items-center">
                          {address.isDefault && (
                            <View className="bg-blue-100 px-2 py-0.5 rounded-full mr-2">
                              <Text className="text-blue-700 font-poppins-medium text-xs">Default</Text>
                            </View>
                          )}
                          {selectedAddress?.id === address.id && (
                            <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                          )}
                        </View>
                      </View>
                      <Text className="text-gray-600 font-poppins-medium text-sm">{address.street}</Text>
                      <Text className="text-gray-600 font-poppins-medium text-sm">
                        {address.city}, {address.zip} · {address.country}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-5 flex-row items-center"
                  onPress={() => { setShowAddressModal(false); setShowAddressForm(true); }}
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                    <Ionicons name="add" size={22} color="#2563EB" />
                  </View>
                  <View>
                    <Text className="text-gray-900 font-poppins-semibold">Add New Address</Text>
                    <Text className="text-gray-400 font-poppins-medium text-xs mt-0.5">Saved when you place your order</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            <View className="h-20" />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Checkout Sheet */}
      <CheckoutSheet
        visible={showCheckoutSheet}
        onClose={() => setShowCheckoutSheet(false)}
        cart={cart}
        subtotal={subtotal}
        discountAmount={discountAmount}
        discountPercent={discountPercent}
        discountedProductId={discountedProductId}
        storedCouponCode={storedCouponCode}
        selectedAddress={selectedAddress ?? savedInlineAddress}
        onOrderPlaced={handleOrderPlaced}
      />
    </SafeAreaView>
  );
}
