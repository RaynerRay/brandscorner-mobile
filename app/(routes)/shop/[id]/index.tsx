import useUser from "@/hooks/useUser";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useGlobalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const { width } = Dimensions.get("window");

export default function ShopDetailsScreen() {
  const { id } = useGlobalSearchParams();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Products");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Fetch shop data
  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ["shop", id],
    queryFn: async () => {
      const response = await axiosInstance.get(`/seller/api/get-seller/${id}`);
      return response.data.shop;
    },
  });

  // Fetch shop products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["shop-products", id],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/seller/api/get-seller-products/${id}`
      );
      return response.data.products;
    },
    enabled: !!shop,
  });

  // Calculate isFollowing dynamically
  const isFollowing = React.useMemo(() => {
    if (!user || !shop?.followers) return false;
    return shop.followers.some(
      (follower: any) => follower?.userId === user?.id
    );
  }, [user, shop?.followers]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error("Please login to follow shops");
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        await axiosInstance.post(`/seller/api/unfollow-shop`, {
          shopId: shop.id,
        });
        toast.success("Unfollowed successfully");
      } else {
        await axiosInstance.post(`/seller/api/follow-shop`, {
          shopId: shop.id,
        });
        toast.success("Followed successfully");
      }

      // Invalidate and refetch shop data
      await queryClient.invalidateQueries({ queryKey: ["shop", id] });
    } catch (error) {
      console.error("Follow/Unfollow error:", error);
      toast.error("Failed to update follow status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async () => {
    if (isChatLoading) {
      return;
    }
    setIsChatLoading(true);
    try {
      const res = await axiosInstance.post(
        "/chatting/api/create-user-conversationGroup",
        { sellerId: shop?.id }
      );
      router.push(`/(routes)/chat/${res.data.conversation.id}`);
    } catch (error) {
      console.log(error);
      toast.error("Failed to start chat. Please try again.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderHeader = () => (
    <View>
      {/* Cover Image with Gradient Overlay */}
      <View className="relative">
        <Image
          source={{
            uri:
              shop?.coverBanner ||
              "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=300&fit=crop&crop=center",
          }}
          className="w-full h-64 bg-gray-100"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

        {/* Header Actions */}
        <View className="absolute top-12 left-4 right-4 flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full items-center justify-center border border-white/30"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Shop Info Card */}
      <View className="px-4 -mt-16 relative z-10">
        <View className="bg-white rounded-3xl p-6 shadow-[0_0_3px_rgba(0,0,0,0.1)] border border-gray-100">
          <View className="flex-row items-start">
            <View className="relative">
              <Image
                source={{
                  uri:
                    shop?.avatar ||
                    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center",
                }}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
            </View>
            <View className="flex-1 ml-4">
              <View className="flex-row items-center">
                <Text className="text-2xl font-poppins-bold text-gray-900 flex-1">
                  {shop?.name || "Loading..."}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm mt-1 font-poppins-medium">
                {shop?.bio || "No bio available."}
              </Text>
              <View className="flex-row items-center mt-2">
                <Ionicons name="star" size={16} color="#FCD34D" />
                <Text className="text-gray-600 ml-1 font-poppins-medium">
                  {shop?.ratings || "N/A"}
                </Text>
                <View className="flex-row items-center ml-4">
                  <Ionicons name="people" size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-1 font-poppins-medium">
                    {Array.isArray(shop?.followers)
                      ? shop.followers.length
                      : shop?.followers || "0"}{" "}
                    Followers
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center mt-2">
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text className="text-gray-500 ml-1 text-sm font-poppins-medium">
                  {shop?.opening_hours || "Mon - Sat: 9 AM - 6 PM"}
                </Text>
              </View>
              <View className="flex-row items-center mt-1">
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text className="text-gray-500 ml-1 text-sm font-poppins-medium">
                  {shop?.address || "Location not available"}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mt-6 flex-row gap-4">
            <TouchableOpacity
              onPress={handleFollowToggle}
              disabled={isLoading}
              className={`flex-1 py-4 rounded-2xl ${
                isFollowing
                  ? "bg-gray-100 border border-gray-200"
                  : "bg-blue-600 shadow-lg"
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-center font-poppins-bold text-base ${
                  isLoading
                    ? "text-gray-400"
                    : isFollowing
                    ? "text-gray-700"
                    : "text-white"
                }`}
              >
                {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleChat}
              disabled={isChatLoading}
              className="flex-1 py-4 rounded-2xl bg-green-600 shadow"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="chatbubble" size={18} color="white" />
                <Text className="text-center font-poppins-bold text-base text-white ml-2">
                  {isChatLoading ? "..." : "Chat"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Shop Details Section */}
      <View className="px-4 mt-6">
        <View className="bg-white rounded-2xl p-6 shadow-[0_0_3px_rgba(0,0,0,0.1)] border border-gray-100">
          <Text className="text-xl font-poppins-bold text-gray-900 mb-4">
            Shop Details
          </Text>

          <View className="space-y-4">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={18} color="#6B7280" />
              <Text className="text-gray-600 ml-3 font-poppins-medium">
                Joined At:{" "}
                {shop?.createdAt
                  ? new Date(shop.createdAt).toLocaleDateString()
                  : "N/A"}
              </Text>
            </View>

            {shop?.website && (
              <View className="flex-row items-center">
                <Ionicons name="globe-outline" size={18} color="#6B7280" />
                <TouchableOpacity className="ml-3">
                  <Text className="text-blue-600 font-poppins-medium underline">
                    {shop.website}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {shop?.socialLinks && shop.socialLinks.length > 0 && (
              <View>
                <Text className="text-gray-900 font-poppins-semibold mb-2">
                  Follow Us:
                </Text>
                <View className="flex-row space-x-3">
                  {shop.socialLinks.map((link: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                    >
                      <Ionicons
                        name={
                          link.type === "youtube"
                            ? "logo-youtube"
                            : link.type === "x"
                            ? "logo-twitter"
                            : "link"
                        }
                        size={16}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View className="px-4 mt-6">
        <View className="flex-row bg-gray-100 rounded-2xl p-1">
          {["Products", "Offers", "Reviews"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl ${
                activeTab === tab ? "bg-white" : ""
              }`}
            >
              <Text
                className={`text-center font-poppins-semibold ${
                  activeTab === tab ? "text-blue-600" : "text-gray-600"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderProductItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl shadow-lg mb-4 overflow-hidden border border-gray-100"
      style={{ width: (width - 48) / 2 }}
      onPress={() =>
        router.push({
          pathname: "/(routes)/product/[id]",
          params: {
            id: item.slug,
          },
        })
      }
    >
      <View className="relative">
        <Image
          source={{
            uri:
              item.images[0]?.url ||
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop&crop=center",
          }}
          className="w-full h-40 bg-gray-100"
          resizeMode="cover"
        />
      </View>
      <View className="p-4">
        <Text
          className="font-poppins-semibold text-gray-900 mb-2 text-sm"
          numberOfLines={2}
        >
          {item?.title}
        </Text>
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Text className="text-lg font-poppins-bold text-gray-900">
              ${item.sale_price}
            </Text>
            {item.regular_price && (
              <Text className="text-sm text-gray-400 line-through ml-2 font-poppins-medium">
                ${item.regular_price}
              </Text>
            )}
          </View>
          <View className="flex-row items-center">
            <Ionicons name="star" size={12} color="#FCD34D" />
            <Text className="text-sm text-gray-600 ml-1 font-poppins-medium">
              {item.ratings}
            </Text>
          </View>
        </View>
        <Text className="text-sm text-gray-500 font-poppins-medium">
          {item.totalSales} sold
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    if (activeTab === "Products") {
      return (
        <View className="px-4 mt-6">
          {productsLoading ? (
            <View className="flex-row justify-between">
              {[1, 2].map((item) => (
                <View
                  key={item}
                  className="bg-white rounded-2xl shadow-lg mb-4 overflow-hidden border border-gray-100"
                  style={{ width: (width - 48) / 2 }}
                >
                  <View className="w-full h-40 bg-gray-200 animate-pulse" />
                  <View className="p-4">
                    <View className="bg-gray-200 h-4 rounded mb-2 animate-pulse" />
                    <View className="bg-gray-200 h-4 w-3/4 rounded mb-2 animate-pulse" />
                    <View className="bg-gray-200 h-6 w-1/2 rounded animate-pulse" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={
                products?.filter((product: any) => !product.starting_date) || []
              }
              renderItem={renderProductItem}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              ItemSeparatorComponent={() => <View className="h-4" />}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              ListEmptyComponent={() => (
                <View className="items-center py-8">
                  <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 font-poppins-medium mt-2">
                    No products available yet!
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      );
    }

    if (activeTab === "Offers") {
      return (
        <View className="px-4 mt-6">
          {productsLoading ? (
            <View className="flex-row justify-between">
              {[1, 2].map((item) => (
                <View
                  key={item}
                  className="bg-white rounded-2xl shadow-lg mb-4 overflow-hidden border border-gray-100"
                  style={{ width: (width - 48) / 2 }}
                >
                  <View className="w-full h-40 bg-gray-200 animate-pulse" />
                  <View className="p-4">
                    <View className="bg-gray-200 h-4 rounded mb-2 animate-pulse" />
                    <View className="bg-gray-200 h-4 w-3/4 rounded mb-2 animate-pulse" />
                    <View className="bg-gray-200 h-6 w-1/2 rounded animate-pulse" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={
                products?.filter((product: any) => product.starting_date) || []
              }
              renderItem={renderProductItem}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              ItemSeparatorComponent={() => <View className="h-4" />}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              ListEmptyComponent={() => (
                <View className="items-center py-8">
                  <Ionicons name="pricetag-outline" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 font-poppins-medium mt-2">
                    No offers available yet!
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      );
    }

    if (activeTab === "Reviews") {
      return (
        <View className="px-4 mt-6">
          <View className="bg-white rounded-xl p-6 shadow-[0_0_3px_rgba(0,0,0,0.1)] border border-gray-50 mb-4">
            <Text className="text-lg font-poppins-bold text-gray-900 mb-4">
              Customer Reviews
            </Text>
            <Text className="text-gray-500 font-poppins-medium">
              No reviews available yet!
            </Text>
          </View>
        </View>
      );
    }
  };

  if (shopLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <View className="flex-1 justify-center items-center">
          <View className="w-16 h-16 bg-blue-600 rounded-full items-center justify-center">
            <Ionicons name="storefront" size={32} color="white" />
          </View>
          <Text className="text-gray-600 font-poppins-medium mt-4">
            Loading shop details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderTabContent()}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
