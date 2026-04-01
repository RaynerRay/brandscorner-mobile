import { useStore } from "@/store";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import {
    CardField,
    StripeProvider,
    useStripe,
} from "@stripe/stripe-react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

function PaymentContent() {
  const { clearCart } = useStore();
  const params = useLocalSearchParams();
  const sessionId = params.sessionId as string;
  const { confirmPayment } = useStripe();

  const [cardholderName, setCardholderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [coupon, setCoupon] = useState<any>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  // Verify session and get payment details
  React.useEffect(() => {
    const fetchSessionAndClientSecret = async () => {
      if (!sessionId) {
        setError("Invalid session. Please try again.");
        setLoading(false);
        return;
      }

      try {
        const verifyRes = await axiosInstance.get(
          `/order/api/verifying-payment-session?sessionId=${sessionId}`
        );

        const { totalAmount, sellers, cart, coupon } = verifyRes.data.session;

        if (
          !sellers ||
          sellers.length === 0 ||
          totalAmount === undefined ||
          totalAmount === null
        ) {
          throw new Error("Invalid payment session data.");
        }

        setCartItems(cart);
        setCoupon(coupon);
        setTotalAmount(totalAmount);
        const sellerStripeAccountId = sellers[0].stripeAccountOd;

        const intentRes = await axiosInstance.post(
          "/order/api/create-payment-intent",
          {
            amount: coupon?.discountAmount
              ? totalAmount - coupon?.discountAmount
              : totalAmount,
            sellerStripeAccountId,
            sessionId,
          }
        );

        setClientSecret(intentRes.data.clientSecret);
      } catch (err: any) {
        console.error(err);
        setError("Something went wrong while preparing your payment.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndClientSecret();
  }, [sessionId]);

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.sale_price * (item.quantity || 1),
      0
    );
  };

  const subtotal = calculateSubtotal();
  const total = coupon?.discountAmount
    ? totalAmount - coupon.discountAmount
    : totalAmount;

  const validateForm = () => {
    if (!cardholderName.trim()) {
      toast.error("Please enter cardholder name");
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    if (!clientSecret) {
      toast.error("Payment session not ready. Please try again.");
      return;
    }

    setIsProcessing(true);
    try {
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: "Card",
        paymentMethodData: {
          billingDetails: {
            name: cardholderName,
          },
        },
      });

      if (error) {
        console.error("Payment error:", error);
        toast.error(error.message || "Payment failed. Please try again.");
      } else if (paymentIntent) {
        // Payment successful
        setShowSuccessModal(true);
        clearCart();
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View className="flex-1 justify-center items-center px-4">
          <View className="animate-spin mb-4">
            <Ionicons name="refresh" size={48} color="#2563EB" />
          </View>
          <Text className="text-xl font-poppins-bold text-gray-900 mb-2">
            Preparing Payment
          </Text>
          <Text className="text-gray-500 text-center font-poppins-medium">
            Please wait while we set up your payment...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-xl font-poppins-bold text-gray-900 mt-4 mb-2">
            Payment Error
          </Text>
          <Text className="text-gray-500 text-center font-poppins-medium mb-8">
            {error}
          </Text>
          <TouchableOpacity
            className="bg-blue-600 px-8 py-4 rounded-xl"
            onPress={() => router.back()}
          >
            <Text className="text-white font-poppins-semibold text-lg">
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-poppins-bold text-gray-900">
              Payment
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Payment Form */}
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <Text className="text-lg font-poppins-semibold text-gray-900 mb-4">
            Payment Details
          </Text>

          {/* Stripe Card Field */}
          <View className="mb-4">
            <Text className="text-gray-700 font-poppins-medium mb-2">
              Card Details
            </Text>
            <CardField
              postalCodeEnabled={false}
              placeholders={{
                number: "4242 4242 4242 4242",
              }}
              cardStyle={{
                backgroundColor: "#FFFFFF",
                textColor: "#000000",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
              style={{
                width: "100%",
                height: 50,
                marginVertical: 8,
              }}
            />
          </View>

          {/* Cardholder Name */}
          <View className="mb-4">
            <Text className="text-gray-700 font-poppins-medium mb-2">
              Cardholder Name
            </Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 font-poppins-medium"
              placeholder="John Doe"
              value={cardholderName}
              onChangeText={setCardholderName}
            />
          </View>
        </View>

        {/* Order Summary */}
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <Text className="text-lg font-poppins-semibold text-gray-900 mb-4">
            Order Summary
          </Text>

          {/* Cart Items */}
          {cartItems.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center justify-between mb-3"
            >
              <View className="flex-1">
                <Text
                  className="font-poppins-medium text-gray-900"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text className="text-gray-500 font-poppins-medium text-sm">
                  Qty: {item.quantity || 1}
                </Text>
              </View>
              <Text className="font-poppins-semibold text-gray-900">
                ${(item.sale_price * (item.quantity || 1)).toFixed(2)}
              </Text>
            </View>
          ))}

          <View className="border-t border-gray-200 pt-3 mt-3">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600 font-poppins-medium">
                Subtotal
              </Text>
              <Text className="font-poppins-semibold text-gray-900">
                ${subtotal.toFixed(2)}
              </Text>
            </View>
            {coupon && (
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-600 font-poppins-medium">
                  Discount
                </Text>
                <Text className="text-green-600 font-poppins-semibold">
                  -${coupon.discountAmount.toFixed(2)}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600 font-poppins-medium">
                Shipping
              </Text>
              <Text className="font-poppins-semibold text-gray-900">Free</Text>
            </View>
            <View className="flex-row justify-between items-center pt-2 border-t border-gray-200">
              <Text className="text-lg font-poppins-bold text-gray-900">
                Total
              </Text>
              <Text className="text-xl font-poppins-bold text-gray-900">
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          className={`py-4 rounded-xl mb-6 ${
            isProcessing ? "bg-gray-400" : "bg-blue-600"
          }`}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          <View className="flex-row items-center justify-center">
            {isProcessing ? (
              <>
                <View className="animate-spin mr-2">
                  <Ionicons name="refresh" size={20} color="white" />
                </View>
                <Text className="text-white font-poppins-semibold text-lg">
                  Processing...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="card-outline"
                  size={20}
                  color="white"
                  className="mr-2"
                />
                <Text className="text-white font-poppins-semibold text-lg">
                  Pay ${total.toFixed(2)}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View className="h-20" />
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="checkmark" size={32} color="#059669" />
              </View>
              <Text className="text-xl font-poppins-bold text-gray-900 text-center mb-2">
                Payment Successful!
              </Text>
              <Text className="text-gray-600 font-poppins-medium text-center">
                Your order has been placed successfully. You will receive a
                confirmation email shortly.
              </Text>
            </View>

            <TouchableOpacity
              className="bg-blue-600 py-4 rounded-xl"
              onPress={() => {
                setShowSuccessModal(false);
                router.push("/(tabs)");
              }}
            >
              <Text className="text-white font-poppins-semibold text-center">
                Continue Shopping
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function PaymentScreen() {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
    >
      <PaymentContent />
    </StripeProvider>
  );
}
