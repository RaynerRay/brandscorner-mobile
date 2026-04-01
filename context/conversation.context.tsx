import React, { createContext, useContext, useState } from "react";

interface ConversationContextType {
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(
  undefined
);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  return (
    <ConversationContext.Provider
      value={{ selectedConversationId, setSelectedConversationId }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error(
      "useConversation must be used within a ConversationProvider"
    );
  }
  return context;
};
