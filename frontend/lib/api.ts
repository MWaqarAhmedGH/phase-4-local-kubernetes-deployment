/**
 * API client for communicating with the Todo Chatbot backend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface ChatResponse {
  response: string;
  conversation_id: string;
  tool_calls: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  tool_calls: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }> | null;
  created_at: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Get the JWT token from Better Auth session.
 * This should be replaced with actual Better Auth token retrieval.
 */
async function getAuthToken(): Promise<string | null> {
  // In a real implementation, this would get the token from Better Auth
  // For now, we'll check for a token in localStorage or cookies
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}

/**
 * Make an authenticated API request.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Redirect to login on auth failure - but only if not already on signin page
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      // Prevent redirect loop - only redirect if NOT on auth pages
      if (!currentPath.startsWith("/signin") && !currentPath.startsWith("/signup")) {
        // Clear invalid token before redirect
        localStorage.removeItem("auth_token");
        window.location.href = "/signin";
      }
    }
    throw new ApiError(401, "Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.detail || "An error occurred"
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Send a chat message and receive AI response.
 */
export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  return apiRequest<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
  });
}

/**
 * Get all conversations for the current user.
 */
export async function getConversations(): Promise<Conversation[]> {
  return apiRequest<Conversation[]>("/api/chat/conversations");
}

/**
 * Get a single conversation by ID.
 */
export async function getConversation(
  conversationId: string
): Promise<Conversation> {
  return apiRequest<Conversation>(`/api/chat/conversations/${conversationId}`);
}

/**
 * Get all messages for a conversation.
 */
export async function getConversationMessages(
  conversationId: string
): Promise<Message[]> {
  return apiRequest<Message[]>(
    `/api/chat/conversations/${conversationId}/messages`
  );
}

/**
 * Delete a conversation and all its messages.
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  await apiRequest<void>(`/api/chat/conversations/${conversationId}`, {
    method: "DELETE",
  });
}

/**
 * Set the auth token (for use after login).
 */
export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}

/**
 * Clear the auth token (for use after logout).
 */
export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}

export { ApiError };
export type { ChatResponse, Conversation, Message };
