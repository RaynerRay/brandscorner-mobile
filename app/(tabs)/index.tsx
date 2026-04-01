import ShopCard from "@/components/cards/shop.card";
import BigSaleBanner from "@/components/home/banner";
import Header from "@/components/home/header";
import ProductSection from "@/components/home/products";
import ProductSkeleton from "@/components/skelton/product.skelton";
import ShopSkeleton from "@/components/skelton/shop.skelton";
import useUser from "@/hooks/useUser";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { user } = useUser();

  const fetchProducts = async () => {
    const response = await axiosInstance.get("/product/api/get-all-products", {
      params: {
        page: 1,
        limit: 10,
      },
    });
    return response.data.products;
  };

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // Fetch recommended products for the user
  const { data: recommendedProducts, isLoading: recommendedLoading } = useQuery(
    {
      queryKey: ["recommended-products", user?.id],
      queryFn: async () => {
        if (!user) return [];
        const response = await axiosInstance.get(
          "/recommendation/api/get-recommendation-products"
        );
        return response.data.recommendations || [];
      },
      enabled: !!user, // Only fetch if user is logged in
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    }
  );

  const { data: shops, isLoading: shopLoading } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/top-shops");
      return res.data.shops;
    },
    staleTime: 1000 * 60 * 2,
  });

  const onShopPress = (shop: any) => {
    router.push({
      pathname: "/(routes)/shop/[id]",
      params: {
        id: shop.id,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle={"dark-content"} backgroundColor={"#fff"} />
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}>
        <BigSaleBanner />

        {user && (
          <>
            {recommendedLoading ? (
              <View className="py-6">
                <View className="px-4 mb-4">
                  <Text
                    className="text-2xl text-gray-900"
                    style={{
                      fontFamily: "Inter-SemiBold",
                      fontWeight: Platform.OS === "android" ? "600" : "normal",
                    }}
                  >
                    You might like
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <ProductSkeleton />
                  <ProductSkeleton />
                  <ProductSkeleton />
                  <ProductSkeleton />
                  <ProductSkeleton />
                </ScrollView>
              </View>
            ) : (
              recommendedProducts &&
              recommendedProducts.length > 0 && (
                <View className="py-6">
                  <View className="px-4 mb-4">
                    <Text
                      className="text-2xl text-gray-900"
                      style={{
                        fontFamily: "Inter-SemiBold",
                        fontWeight:
                          Platform.OS === "android" ? "600" : "normal",
                      }}
                    >
                      You might like
                    </Text>
                  </View>
                  <ProductSection
                    title=""
                    products={recommendedProducts}
                    hideTitle={true}
                  />
                </View>
              )
            )}
          </>
        )}

        {isLoading ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="my-4 mx-2"
            >
              {[0, 1, 2, 3, 4].map((i: any) => (
                <ProductSkeleton key={i} />
              ))}
            </ScrollView>
          </>
        ) : (
          <>
            <ProductSection title="New Items" products={products} />
          </>
        )}

        {/* Top Shops section */}
        <View className="px-4 py-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-2xl text-gray-900"
              style={{
                fontFamily: "Inter-SemiBold",
                fontWeight: Platform.OS === "android" ? "600" : "normal",
              }}
            >
              Top Shops
            </Text>
            <TouchableOpacity className="flex-row items-center bg-blue-50 px-3 py-2 rounded-full">
              <Text className="text-blue-600 font-semibold mr-1 text-sm">
                See All
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {shopLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <ShopSkeleton />
              <ShopSkeleton />
              <ShopSkeleton />
            </ScrollView>
          ) : (
            shops?.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {shops?.map((shop: any) => (
                  <ShopCard
                    key={shop?.id}
                    shop={shop}
                    onPress={() => onShopPress(shop)}
                  />
                ))}
              </ScrollView>
            )
          )}
        </View>

        <ProductSection
          title="Flash Sale"
          products={products}
          isFlashSale={true}
        />

        <View className="h-14" />
      </ScrollView>
    </SafeAreaView>
  );
}
