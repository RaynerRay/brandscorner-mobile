import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";

export const useUnreadMessages = () => {
  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/chatting/api/get-user-conversations"
      );
      return res.data.conversations;
    },
  });

  const totalUnread = conversations?.reduce((total: number, conv: any) => {
    return total + (conv.unreadCount || 0);
  }, 0) || 0;

  return { totalUnread, conversations };
}; 