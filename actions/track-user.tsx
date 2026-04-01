import axiosInstance from "@/utils/axiosInstance";

export async function sendKafkaEvent(eventData: {
  userId?: string;
  productId?: string;
  shopId?: string;
  action: string;
  device?: string;
  country?: string;
  city?: string;
}) {
  try {
    await axiosInstance.post("/auth/api/track-event", {
      ...eventData,
      timestamp: new Date().toISOString(),
      platform: "mobile",
    });
  } catch (error) {
    console.log("Analaytics event failed:", error);
  }
}
