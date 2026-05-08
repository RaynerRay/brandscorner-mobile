import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import Constants from "expo-constants";
import { useEffect } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

const isExpoGo = Constants.executionEnvironment === "storeClient";

interface Props {
  label?: string;
  disabled?: boolean;
}

export default function GoogleSignInButton({
  label = "Continue with Google",
  disabled = false,
}: Props) {
  const { signIn, isPending, error, reset } = useGoogleAuth();

  useEffect(() => {
    if (error) {
      toast.error(error.message);
      reset();
    }
  }, [error, reset]);

  if (isExpoGo) return null;

  return (
    <TouchableOpacity
      className="flex-row items-center justify-center bg-white border border-gray-200 rounded-xl py-4 mb-4"
      onPress={signIn}
      disabled={disabled || isPending}
      activeOpacity={0.7}
    >
      {isPending ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <>
          <View className="w-6 h-6 mr-3">
            <Image
              source={{
                uri: "https://developers.google.com/identity/images/g-logo.png",
              }}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
          <Text className="text-gray-800 text-base font-poppins-medium">
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
