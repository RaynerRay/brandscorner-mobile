import { ConversationProvider } from "@/context/conversation.context";
import { WebSocketProvider } from "@/context/web-socket.context";
import useUser from "@/hooks/useUser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Toaster } from "sonner-native";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ProvidersWithWebSocket>
        {children}
        <Toaster position="bottom-center" />
      </ProvidersWithWebSocket>
    </QueryClientProvider>
  );
}

const ProvidersWithWebSocket = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useUser();

  return (
    <>
      {user && (
        <WebSocketProvider user={user}>
          <ConversationProvider>{children}</ConversationProvider>
        </WebSocketProvider>
      )}
      {!user && <ConversationProvider>{children}</ConversationProvider>}
    </>
  );
};
