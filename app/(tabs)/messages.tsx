import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Conversation {
  conversationId: string;
  lastMessage: string;
  lastMessageAt: string;
  seller: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  unreadCount: number;
}

export default function Messages() {
  const { id: conversationId } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Fetch conversations
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/chatting/api/get-user-conversations"
      );
      return res.data.conversations;
    },
  });

  // Filter conversations based on search query
  const filteredConversations =
    conversations?.filter((conversation: Conversation) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const sellerName = conversation.seller.name.toLowerCase();
      const lastMessage = conversation.lastMessage.toLowerCase();

      return sellerName.includes(query) || lastMessage.includes(query);
    }) || [];

  useEffect(() => {
    if (conversationId && conversations && typeof conversationId === "string") {
      const chat = conversations.find(
        (conv: Conversation) => conv.conversationId === conversationId
      );
      if (chat) {
        handleChatSelect(chat);
      }
    }
  }, [conversationId, conversations]);

  const handleChatSelect = (chat: Conversation) => {
    // Navigate to dedicated chat screen
    router.push(`/(routes)/chat/${chat.conversationId}`);
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery("");
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-xl font-poppins-bold text-gray-900">
              Messages
            </Text>
          </View>

          <TouchableOpacity onPress={toggleSearch}>
            <Ionicons
              name={isSearchVisible ? "close" : "search-outline"}
              size={24}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        {isSearchVisible && (
          <View className="mt-4">
            <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                placeholder="Search conversations..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-2 font-poppins-medium text-gray-900"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* content */}
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <View className="animate-spin">
              <Ionicons name="refresh" size={48} color="#6B7280" />
            </View>
            <Text className="text-gray-500 font-poppins-medium mt-4 text-center text-lg">
              Loading conversations...
            </Text>
          </View>
        ) : filteredConversations.length > 0 ? (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {filteredConversations?.map((conversation: Conversation) => (
              <TouchableOpacity
                key={conversation.conversationId}
                className="flex-row items-center p-4 border-b border-gray-100"
                onPress={() => handleChatSelect(conversation)}
                activeOpacity={0.7}
              >
                <View className="relative">
                  <Image
                    source={{ uri: conversation.seller.avatar }}
                    className="w-12 h-12 rounded-full"
                    resizeMode="cover"
                  />
                  {conversation.seller.isOnline && (
                    <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </View>

                <View className="flex-1 ml-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 font-poppins-semibold">
                      {conversation.seller.name}
                    </Text>
                    <Text className="text-gray-500 font-poppins-medium text-sm">
                      {formatTimestamp(conversation.lastMessageAt)}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between mt-1">
                    <Text
                      className="text-gray-600 font-poppins-medium flex-1 mr-2"
                      numberOfLines={1}
                    >
                      {conversation.lastMessage}
                    </Text>
                    {conversation.unreadCount > 0 && (
                      <View className="bg-blue-600 rounded-full w-5 h-5 items-center justify-center">
                        <Text className="text-white font-poppins-bold text-xs">
                          {conversation.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : searchQuery.trim() ? (
          <View className="flex-1 justify-center items-center px-4">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="search-outline" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 font-poppins-semibold text-xl text-center mb-2">
              No Results Found
            </Text>
            <Text className="text-gray-500 font-poppins-medium text-center">
              No conversations match &quot;{searchQuery}&quot;
            </Text>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center px-4">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 font-poppins-semibold text-xl text-center mb-2">
              No Messages Yet
            </Text>
            <Text className="text-gray-500 font-poppins-medium text-center">
              Start a conversation with sellers to see your messages here
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
