export const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return process.env.API_BASE_URL || "http://localhost:8000";
  }

  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
};

export interface ChatRequestPayload {
  chatId: string;
  roleId: string;
  useMemory: boolean;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
}

export interface ChatStreamChunk {
  delta?: string;
  error?: string;
  conversationTitle?: string;
}
