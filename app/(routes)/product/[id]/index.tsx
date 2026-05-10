import useUser from "@/hooks/useUser";
import { useStore } from "@/store";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useGlobalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RenderHtml from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { defaultVariantSelection } from "@/utils/cartVariant";

const { width } = Dimensions.get("window");

function formatStoredColor(color: string): string {
  const c = color.trim();
  if (!c) return "";
  return c.startsWith("#") ? c.toUpperCase() : c;
}

export default function ProductDetailScreen() {
  const { id } = useGlobalSearchParams();
  const { user } = useUser();
  const { wishlist, addToWishlist, removeFromWishlist, addToCart } = useStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  // fetch the product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/product/api/get-product/${id}`
      );
      return response.data.product;
    },
  });

  useEffect(() => {
    if (!product?.id) return;
    const v = defaultVariantSelection(product);
    setSelectedColor(v.color || "");
    setSelectedSize(v.size || "");
    setQuantity(1);
    setSelectedImageIndex(0);
  }, [product?.id]);

  // Fetch related products
  const { data: relatedProducts, isLoading: relatedLoading } = useQuery({
    queryKey: ["related-products", id],
    queryFn: async () => {
      try {
        // Build query string manually since URLSearchParams isn't available in React Native
        const queryParams = [
          "priceRange=0,1000", // Default price range
          "page=1",
          "limit=5",
        ].join("&");

        const response = await axiosInstance.get(
          `/product/api/get-filtered-products?${queryParams}`
        );
        return response.data.products || [];
      } catch (error) {
        console.error("Failed to fetch related products", error);
        return [];
      }
    },
    enabled: !!product,
  });

  // Fetch product reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["product-reviews", id],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/product/api/get-product-reviews/${id}`
      );
      return response.data.reviews || [];
    },
    enabled: !!product,
  });

  // Check if product is in wishlist
  const isWishlisted = product
    ? wishlist.some((item) => item.id === product.id)
    : false;

  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error("Please login to add items to wishlist");
      return;
    }

    if (!product) return;

    if (isWishlisted) {
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
          colors: product.colors,
          sizes: product.sizes,
        },
        user,
        null,
        "Mobile App"
      );
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }

    if (!product) return;

    addToCart(
      {
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.sale_price || product.regular_price,
        image: product.images?.[0]?.url || "",
        shopId: product.Shop?.id || "",
        quantity,
        colors: product.colors,
        sizes: product.sizes,
        selectedOptions: {
          color: selectedColor,
          size: selectedSize,
        },
      },
      user,
      null,
      "Mobile App"
    );
    router.push("/(tabs)/cart");
  };

  // Handle buy now
  const handleBuyNow = async () => {
    if (!user) {
      toast.error("Please login to purchase");
      return;
    }

    if (!product) return;

    // Add to cart first
    addToCart(
      {
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.sale_price || product.regular_price,
        image: product.images?.[0]?.url || "",
        shopId: product.Shop?.id || "",
        quantity,
        colors: product.colors,
        sizes: product.sizes,
        selectedOptions: {
          color: selectedColor,
          size: selectedSize,
        },
      },
      user,
      null,
      "Mobile App"
    );

    // Navigate to cart
    router.push("/(tabs)/cart");
  };

  const renderImageGallery = () => {
    if (!product?.images || product.images.length === 0) {
      return (
        <View className="mb-6">
          <View className="relative">
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&crop=center",
              }}
              style={{ width, height: width }}
              className="bg-gray-100"
              resizeMode="cover"
            />
          </View>
        </View>
      );
    }

    return (
      <View className="mb-6">
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setSelectedImageIndex(index);
          }}
        >
          {product.images.map((image: any, index: number) => (
            <View key={index} className="relative">
              <Image
                source={{ uri: image.url || image }}
                style={{ width, height: width }}
                className="bg-gray-100"
                resizeMode="cover"
              />
              {/* Discount Badge */}
              {index === 0 && product.sale_price && (
                <View className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full">
                  <Text className="text-white text-sm font-bold">
                    -
                    {Math.round(
                      ((product.regular_price - product.sale_price) /
                        product.regular_price) *
                        100
                    )}
                    %
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Image Indicators */}
        <View className="flex-row justify-center mt-4">
          {product.images.map((_: any, index: number) => (
            <View
              key={index}
              className={`w-2 h-2 rounded-full mx-1 ${
                index === selectedImageIndex ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderProdcutInfo = () => {
    return (
      <View className="px-4 mb-6">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-poppins-semibold text-gray-900 flex-1">
            {product?.title || "Loading..."}
          </Text>
          <TouchableOpacity
            onPress={handleWishlistToggle}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={20}
              color={isWishlisted ? "#EF4444" : "#6B7280"}
            />
          </TouchableOpacity>
        </View>

        {/* Ratings and Sales */}
        <View className="flex-row items-center mb-4">
          <View className="flex-row items-center mr-4">
            <Ionicons name="star" size={16} color="#FCD34D" />
            <Text className="text-gray-700 ml-1 font-medium">
              {product?.rating || 4.5} ({product?.reviews?.length || 0} reviews)
            </Text>
          </View>
          <Text className="text-gray-500">
            • {product?.totalSales || "0"} sold
          </Text>
        </View>

        {/* price */}
        <View className="flex-row items-center mb-6">
          <Text className="text-3xl font-poppins-semibold text-gray-900 mr-3">
            ${product?.sale_price || product?.regular_price || "0"}
          </Text>
          {product?.sale_price && product?.regular_price && (
            <Text className="text-lg text-gray-400 line-through">
              ${product.regular_price}
            </Text>
          )}
        </View>

        {/* Shop Info */}
        {product?.Shop && (
          <TouchableOpacity
            className="flex-row items-center bg-gray-50 p-4 rounded-xl mb-6"
            onPress={() =>
              router.push({
                pathname: "/(routes)/shop/[id]",
                params: {
                  id: product.Shop.id,
                },
              })
            }
          >
            <Image
              source={{ uri: product.Shop.avatar }}
              className="w-12 h-12 rounded-full mr-3"
            />
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-lg font-poppins-medium text-gray-900">
                  {product.Shop.name}
                </Text>
              </View>
              <View className="flex-row items-center mt-1">
                <Ionicons name="star" size={12} color="#FCD34D" />
                <Text className="text-sm text-gray-600 ml-1">
                  {product.Shop.ratings} • {product.Shop.followers?.length || 0}{" "}
                  followers
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderVariantSelector = () => {
    if (!product) return null;

    return (
      <View className="px-4 mb-6">
        {/* Size Selector */}
        {product.sizes && product.sizes.length > 0 && (
          <View className="mb-4">
            <Text className="text-lg font-poppins-medium text-gray-900 mb-3">
              Size
            </Text>
            <View className="flex-row flex-wrap">
              {product.sizes.map((size: string) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => setSelectedSize(size)}
                  className={`mr-3 mb-2 px-4 py-2 rounded-lg border ${
                    selectedSize === size
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      selectedSize === size ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Color Selector */}
        {product.colors && product.colors.length > 0 && (
          <View className="mb-4">
            <Text className="text-lg font-poppins-medium text-gray-900 mb-3">
              Color
            </Text>
            <View className="flex-row flex-wrap">
              {product.colors.map((color: string) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  className={`mr-3 mb-2 w-12 h-12 rounded-full border-2 items-center justify-center ${
                    selectedColor === color
                      ? "border-blue-600"
                      : "border-gray-300"
                  }`}
                      style={{
                        backgroundColor: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(
                          color.trim()
                        )
                          ? color.trim().toLowerCase()
                          : "#e5e7eb",
                      }}
                >
                  {selectedColor === color && (
                    <View className="w-6 h-6 bg-white rounded-full items-center justify-center">
                      <Ionicons name="checkmark" size={16} color="#2563EB" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quantity Selector */}
        <View>
          <Text className="text-lg font-poppins-medium text-gray-900 mb-3">
            Quantity
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => quantity > 1 && setQuantity(quantity - 1)}
              className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center"
            >
              <Ionicons name="remove" size={20} color="#6B7280" />
            </TouchableOpacity>
            <Text className="mx-4 text-lg font-medium text-gray-900">
              {quantity}
            </Text>
            <TouchableOpacity
              onPress={() => setQuantity(quantity + 1)}
              className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center"
            >
              <Ionicons name="add" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View className="px-4 mb-6">
      {/* Tab Headers */}
      <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
        {["description", "specifications", "reviews"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3 rounded-lg ${
              activeTab === tab ? "bg-white" : ""
            }`}
          >
            <Text
              className={`text-center font-medium capitalize ${
                activeTab === tab ? "text-blue-600" : "text-gray-600"
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === "description" && (
        <View>
          {product?.detailed_description ? (
            <RenderHtml
              contentWidth={width}
              source={{ html: product.detailed_description }}
            />
          ) : (
            <Text className="text-gray-700 leading-6">
              No description available
            </Text>
          )}
        </View>
      )}

      {activeTab === "specifications" && (
        <View>
          <View className="space-y-4">
            {/* Sizes */}
            {product?.sizes && product.sizes.length > 0 && (
              <View className="bg-gray-50 p-4 rounded-xl">
                <Text className="text-lg font-poppins-medium text-gray-900 mb-3">
                  Available Sizes
                </Text>
                <View className="flex-row flex-wrap">
                  {product.sizes.map((size: string) => (
                    <View
                      key={size}
                      className="bg-white px-3 py-2 rounded-lg mr-2 mb-2 border border-gray-200"
                    >
                      <Text className="text-gray-700 font-medium">{size}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Colors */}
            {product?.colors && product.colors.length > 0 && (
              <View className="bg-gray-50 p-4 rounded-xl">
                <Text className="text-lg font-poppins-medium text-gray-900 mb-3">
                  Available Colors
                </Text>
                <View className="flex-row flex-wrap">
                  {product.colors.map((color: string) => (
                    <View
                      key={color}
                      className="flex-row items-center mr-3 mb-2"
                    >
                      <View
                        className="w-6 h-6 rounded-full mr-2 border border-gray-300"
                        style={{
                          backgroundColor: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(
                            color.trim()
                          )
                            ? color.trim().toLowerCase()
                            : "#e5e7eb",
                        }}
                      />
                      <Text className="text-gray-700 font-medium">
                        {formatStoredColor(color)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Custom Specifications */}
            {product?.custom_specifications &&
              Object.keys(product.custom_specifications).length > 0 && (
                <View className="bg-gray-50 p-4 rounded-xl">
                  <Text className="text-lg font-poppins-medium text-gray-900 mb-3">
                    Product Specifications
                  </Text>
                  <View className="space-y-2">
                    {Object.entries(product.custom_specifications).map(
                      ([key, value]) => (
                        <View
                          key={key}
                          className="flex-row justify-between py-2 border-b border-gray-200"
                        >
                          <Text className="text-gray-600 font-medium capitalize">
                            {key.replace(/_/g, " ")}
                          </Text>
                          <Text className="text-gray-900 text-right flex-1 ml-4">
                            {value as string}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}

            {/* Other dynamic specifications */}
            {product?.specifications &&
              Object.keys(product.specifications).length > 0 && (
                <View className="bg-gray-50 p-4 rounded-xl">
                  <Text className="text-lg font-poppins-medium text-gray-900 mb-3">
                    Additional Details
                  </Text>
                  <View className="space-y-2">
                    {Object.entries(product.specifications).map(
                      ([key, value]) => (
                        <View
                          key={key}
                          className="flex-row justify-between py-2 border-b border-gray-200"
                        >
                          <Text className="text-gray-600 font-medium capitalize">
                            {key.replace(/_/g, " ")}
                          </Text>
                          <Text className="text-gray-900 text-right flex-1 ml-4">
                            {value as string}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}

            {/* Show message if no specifications available */}
            {(!product?.sizes || product.sizes.length === 0) &&
              (!product?.colors || product.colors.length === 0) &&
              (!product?.custom_specifications ||
                Object.keys(product.custom_specifications).length === 0) &&
              (!product?.specifications ||
                Object.keys(product.specifications).length === 0) && (
                <View className="items-center py-8">
                  <Text className="text-gray-500">
                    No specifications available
                  </Text>
                </View>
              )}
          </View>
        </View>
      )}

      {activeTab === "reviews" && (
        <View>
          {reviewsLoading ? (
            <View className="items-center py-8">
              <Text className="text-gray-500">Loading reviews...</Text>
            </View>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((review: any) => (
              <View key={review.id} className="mb-4 p-4 bg-gray-50 rounded-xl">
                <View className="flex-row items-center mb-2">
                  <Image
                    source={{
                      uri:
                        review.user?.avatar ||
                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
                    }}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">
                      {review.user?.name || "Anonymous"}
                    </Text>
                    <View className="flex-row items-center">
                      <View className="flex-row mr-2">
                        {[...Array(5)].map((_, i) => (
                          <Ionicons
                            key={i}
                            name="star"
                            size={12}
                            color={i < review.rating ? "#FCD34D" : "#E5E7EB"}
                          />
                        ))}
                      </View>
                      <Text className="text-sm text-gray-500">
                        {review.createdAt}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text className="text-gray-700 mb-2">{review.comment}</Text>
                <TouchableOpacity className="flex-row items-center">
                  <Ionicons
                    name="thumbs-up-outline"
                    size={14}
                    color="#6B7280"
                  />
                  <Text className="text-sm text-gray-500 ml-1">
                    Helpful ({review.helpful || 0})
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View className="items-center py-8">
              <Text className="text-gray-500">No reviews yet</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderRelatedProducts = () => (
    <View className="px-4">
      <Text className="text-xl font-poppins-medium text-gray-900 mb-4">
        Related Products
      </Text>
      {relatedLoading ? (
        <View className="items-center py-8">
          <Text className="text-gray-500">Loading related products...</Text>
        </View>
      ) : relatedProducts && relatedProducts.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {relatedProducts.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              className="mr-4 w-40"
              onPress={() =>
                router.push({
                  pathname: "/(routes)/product/[id]",
                  params: {
                    id: item.slug || item.id,
                  },
                })
              }
            >
              <Image
                source={{
                  uri:
                    item.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&crop=center",
                }}
                className="w-full h-40 bg-gray-100 rounded-xl mb-2"
                resizeMode="cover"
              />
              <Text
                className="font-medium text-gray-900 mb-1"
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-poppins-medium text-gray-900">
                  ${item.sale_price}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="star" size={12} color="#FCD34D" />
                  <Text className="text-sm text-gray-600 ml-1">
                    {item.ratings || 4.5}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View className="items-center py-8">
          <Text className="text-gray-500">No related products available</Text>
        </View>
      )}
    </View>
  );

  // Loading state
  if (productLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View className="flex-1 justify-center items-center">
          <View className="w-16 h-16 bg-blue-600 rounded-full items-center justify-center">
            <Ionicons name="cube" size={32} color="white" />
          </View>
          <Text className="text-gray-600 font-poppins-medium mt-4">
            Loading product details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text className="text-gray-900 font-poppins-bold text-xl mt-4">
            Product Not Found
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            The product you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </Text>
          <TouchableOpacity
            className="mt-6 bg-blue-600 px-6 py-3 rounded-xl"
            onPress={() => router.back()}
          >
            <Text className="text-white font-poppins-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle={"dark-content"} backgroundColor={"#fff"} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-poppins-medium text-gray-900">
          Product Details
        </Text>
        <TouchableOpacity
          onPress={() => handleShare(product)}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
        >
          <Ionicons name="share-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderImageGallery()}
        {renderProdcutInfo()}
        {renderVariantSelector()}
        {renderTabs()}
        {renderRelatedProducts()}
        <View className="h-20" />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="flex-row items-center px-4 py-3 bg-white border-t border-gray-100">
        <TouchableOpacity
          className="flex-1 bg-blue-100 py-4 rounded-xl mr-3"
          onPress={handleAddToCart}
        >
          <Text className="text-center text-blue-600 font-poppins-semibold text-lg">
            Add to Cart
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-blue-600 py-4 rounded-xl"
          onPress={handleBuyNow}
        >
          <Text className="text-center text-white font-poppins-semibold text-lg">
            Buy Now
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Share functionality
const handleShare = async (product: any) => {
  try {
    const shareOptions = {
      title: `Check out this amazing product: ${product.title || product.name}`,
      message: `🛍️ ${product.title || product.name}\n\n💰 Price: $${
        product.sale_price || product.regular_price
      }${
        product.sale_price && product.regular_price
          ? ` (was $${product.regular_price})`
          : ""
      }\n⭐ Rating: ${product.rating || 4.5}/5 (${
        product.reviews?.length || 0
      } reviews)\n🏪 Shop: ${product.shop?.name || "Official Store"}\n\n${
        product.description || "Amazing product!"
      }\n\nGet it now! 🔥`,
      url: `https://yourapp.com/product/${product.id}`, // Replace with your actual app URL
    };

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // Shared via activity type
        console.log("Shared via:", result.activityType);
      } else {
        // Shared successfully
        console.log("Product shared successfully");
      }
    } else if (result.action === Share.dismissedAction) {
      // Share dialog was dismissed
      console.log("Share dialog dismissed");
    }
  } catch (error) {
    console.error("Share error:", error);
  }
};
