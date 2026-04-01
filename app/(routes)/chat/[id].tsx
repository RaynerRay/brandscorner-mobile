import { useConversation } from "@/context/conversation.context";
import { useWebSocket } from "@/context/web-socket.context";
import useUser from "@/hooks/useUser";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmojiPicker from "rn-emoji-selector";
import { emojis } from "rn-emoji-selector/dist/data";
import { toast } from "sonner-native";

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

interface ChatMessage {
  id: string;
  content: string;
  senderType: "user" | "seller";
  seen: boolean;
  createdAt: string;
  time?: string;
  imageUrl?: string;
  messageType?: "text" | "image";
}

export default function ChatDetails() {
  const { id: conversationId } = useLocalSearchParams();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const messageInputRef = useRef<TextInput>(null);
  const { ws } = useWebSocket();
  const { setSelectedConversationId } = useConversation();

  const [messageText, setMessageText] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<any[]>([]);

  // Fetch conversations to get the current chat details
  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/chatting/api/get-user-conversations"
      );
      return res.data.conversations;
    },
  });

  // Get current conversation details
  const currentConversation = conversations?.find(
    (conv: Conversation) => conv.conversationId === conversationId
  );

  // Fetch messages for the conversation
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId || hasFetchedOnce) return [];
      const res = await axiosInstance.get(
        `/chatting/api/get-messages/${conversationId}?page=1`
      );
      setPage(1);
      setHasMore(res.data.hasMore);
      setHasFetchedOnce(true);
      return res.data.messages.reverse();
    },
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000,
  });

  // Set selected conversation in context
  useEffect(() => {
    if (conversationId && typeof conversationId === "string") {
      setSelectedConversationId(conversationId);
    }
  }, [conversationId, setSelectedConversationId]);

  // Websocket message handling
  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event: any) => {
      const data = JSON.parse(event.data);

      if (data.type === "NEW_MESSAGE") {
        const newMsg = data?.payload;

        if (newMsg.conversationId === conversationId) {
          queryClient.setQueryData(
            ["messages", conversationId],
            (old: any = []) => [
              ...old,
              {
                content: newMsg.messageBody || newMsg.content || "",
                senderType: newMsg.senderType,
                seen: false,
                createdAt: newMsg.createdAt || new Date().toISOString(),
                imageUrl: newMsg.imageUrl,
                messageType: newMsg.messageType || "text",
              },
            ]
          );
          scrollToBottom();
        }

        // Update conversation list with new message
        queryClient.setQueryData(["conversations"], (old: any = []) =>
          old.map((conv: Conversation) =>
            conv.conversationId === newMsg.conversationId
              ? { ...conv, lastMessage: newMsg.content || "📷 Image" }
              : conv
          )
        );
      }

      if (data.type === "UNSEEN_COUNT_UPDATE") {
        const { conversationId, count } = data.payload;
        queryClient.setQueryData(["conversations"], (old: any = []) =>
          old.map((conv: Conversation) =>
            conv.conversationId === conversationId
              ? { ...conv, unreadCount: count }
              : conv
          )
        );
      }
    };
  }, [ws, conversationId, queryClient]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Mark conversation as seen when entering
  useEffect(() => {
    if (conversationId && currentConversation) {
      // Mark as seen
      queryClient.setQueryData(["conversations"], (old: any = []) =>
        old.map((conv: Conversation) =>
          conv.conversationId === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );

      // Send WebSocket message to mark as seen
      ws?.send(
        JSON.stringify({
          type: "MARK_AS_SEEN",
          conversationId: conversationId,
        })
      );
    }
  }, [conversationId, currentConversation, queryClient, ws]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const loadMoreMessages = async () => {
    if (!conversationId) return;

    const nextPage = page + 1;
    const res = await axiosInstance.get(
      `/chatting/api/get-messages/${conversationId}?page=${nextPage}`
    );

    queryClient.setQueryData(["messages", conversationId], (old: any = []) => [
      ...res.data.messages.reverse(),
      ...old,
    ]);

    setPage(nextPage);
    setHasMore(res.data.hasMore);
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        toast.error("Please grant permission to access your photo library");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      toast.error("Failed to pick image");
    }
  };

  const handleImageUpload = async (imageUri: string) => {
    if (!conversationId || !currentConversation) return;

    setIsUploading(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "chat-image.jpg",
      } as any);

      // Upload image to your server
      const uploadResponse = await axiosInstance.post(
        "/upload/chat-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const imageUrl = uploadResponse.data.imageUrl;

      // Send image message via WebSocket
      const payload = {
        fromUserId: user?.id,
        toUserId: currentConversation.seller.id,
        messageBody: "📷 Image",
        conversationId: conversationId,
        senderType: "user",
        imageUrl: imageUrl,
        messageType: "image",
      };
      ws?.send(JSON.stringify(payload));

      // Optimistically add message to UI
      const newMessage = {
        id: Date.now().toString(),
        content: "📷 Image",
        senderType: "user" as const,
        seen: false,
        createdAt: new Date().toISOString(),
        imageUrl: imageUrl,
        messageType: "image" as const,
      };

      queryClient.setQueryData(
        ["messages", conversationId],
        (old: any = []) => [...old, newMessage]
      );

      // Update conversation list
      queryClient.setQueryData(["conversations"], (old: any = []) =>
        old.map((conv: Conversation) =>
          conv.conversationId === conversationId
            ? {
                ...conv,
                lastMessage: "📷 Image",
                lastMessageAt: new Date().toISOString(),
              }
            : conv
        )
      );

      scrollToBottom();
      toast.success("Image sent successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to send image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId || !currentConversation) return;

    // Send via WebSocket immediately
    const payload = {
      fromUserId: user?.id,
      toUserId: currentConversation.seller.id,
      messageBody: messageText.trim(),
      conversationId: conversationId,
      senderType: "user",
      messageType: "text",
    };
    ws?.send(JSON.stringify(payload));

    // Clear input immediately
    setMessageText("");
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessageText((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  if (!currentConversation) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-poppins-bold text-gray-900">
              Chat
            </Text>
          </View>
        </View>

        {/* Loading State */}
        <View className="flex-1 justify-center items-center">
          <View className="animate-spin">
            <Ionicons name="refresh" size={48} color="#6B7280" />
          </View>
          <Text className="text-gray-500 font-poppins-medium mt-4 text-center text-lg">
            Loading conversation...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Chat Header */}
      <View className="flex-row items-center p-4 border-b border-gray-100 bg-white">
        <TouchableOpacity
          onPress={() => {
            setSelectedConversationId(null);
            router.back();
          }}
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <Image
          source={{ uri: currentConversation.seller.avatar }}
          className="w-10 h-10 rounded-full"
          resizeMode="cover"
        />

        <View className="flex-1 ml-3">
          <Text className="text-gray-900 font-poppins-semibold">
            {currentConversation.seller.name}
          </Text>
          <Text className="text-gray-500 font-poppins-medium text-sm">
            {currentConversation.seller.isOnline ? "Online" : "Offline"}
          </Text>
        </View>

        <TouchableOpacity className="ml-3">
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
      >
        {hasMore && messages?.length > 0 && (
          <View className="items-center mb-4">
            <TouchableOpacity
              onPress={loadMoreMessages}
              className="bg-gray-200 px-4 py-2 rounded-full"
            >
              <Text className="text-gray-700 font-poppins-medium text-sm">
                Load previous messages
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {messages.map((msg: ChatMessage, idx: number) => (
          <View
            key={msg.id || idx}
            className={`mb-4 ${
              msg.senderType === "user" ? "items-end" : "items-start"
            }`}
          >
            <View
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                msg.senderType === "user" ? "bg-blue-600" : "bg-gray-100"
              }`}
            >
              {msg.messageType === "image" && msg.imageUrl ? (
                <Image
                  source={{ uri: msg.imageUrl }}
                  className="w-48 h-32 rounded-lg"
                  resizeMode="cover"
                />
              ) : (
                <Text
                  className={`font-poppins-medium ${
                    msg.senderType === "user" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {msg.content}
                </Text>
              )}
              <Text
                className={`text-xs mt-1 ${
                  msg.senderType === "user" ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {msg.time ||
                  new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="border-t border-gray-100 bg-white"
      >
        <View className="p-4 flex-row items-center">
          <TouchableOpacity
            className="mr-3"
            onPress={pickImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <View className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Ionicons name="image-outline" size={24} color="#6B7280" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mr-3"
            onPress={() => setShowEmojiPicker(true)}
          >
            <Ionicons name="happy-outline" size={24} color="#6B7280" />
          </TouchableOpacity>

          <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-3">
            <TextInput
              ref={messageInputRef}
              placeholder="Type your message..."
              value={messageText}
              onChangeText={setMessageText}
              className="font-poppins-medium text-gray-900"
              multiline
              maxLength={1000}
              onSubmitEditing={handleSendMessage}
            />
          </View>

          <TouchableOpacity
            className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center"
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Emoji Picker modal */}
      <Modal
        visible={showEmojiPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-poppins-semibold text-gray-900">
                Choose Emoji
              </Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View className="flex-1">
              <EmojiPicker
                emojis={emojis}
                recent={recentEmojis}
                autoFocus={false}
                loading={false}
                darkMode={false}
                perLine={7}
                onSelect={handleEmojiSelect}
                onChangeRecent={setRecentEmojis}
                backgroundColor={"#ffffff"}
                enabledCategories={[
                  "recent",
                  "emotion",
                  "emojis",
                  "activities",
                  "flags",
                  "food",
                  "places",
                  "nature",
                ]}
                defaultCategory={"emotion"}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
