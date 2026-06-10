// src/services/chatService.ts
import axiosInstance from "../../api/axiosInstance";
import { loadAuthFromStorage, setAuthToken } from "../auth/authService";
import type { AxiosResponse } from "axios";

// Base URL
const API_BASE_URL = "http://13.61.185.238:5050/api/v1/chats";

// Types
export interface ConversationPayload {
  participants: string[];
  [key: string]: any;
}

export interface MessagePayload {
  conversationId: string;
  content: string;
  [key: string]: any;
}

// Automatically attach token from storage
function applyAuthToken() {
  const stored = loadAuthFromStorage();
  if (stored.token) {
    setAuthToken(stored.token);
  }
}

applyAuthToken();

export const chatService = {
  // Create a new chat conversation
  createConversation: (payload: ConversationPayload): Promise<AxiosResponse> => {
    applyAuthToken();
    return axiosInstance.post(`${API_BASE_URL}/conversations`, payload);
  },

  // Get all conversations for the logged-in user
  getConversations: (): Promise<AxiosResponse> => {
    applyAuthToken();
    return axiosInstance.get(`${API_BASE_URL}/conversations`);
  },

  // Get a single conversation by ID
  getConversationById: (conversationId: string): Promise<AxiosResponse> => {
    applyAuthToken();
    return axiosInstance.get(`${API_BASE_URL}/conversations/${conversationId}`);
  },

  // Send a new message
  sendMessage: (payload: MessagePayload): Promise<AxiosResponse> => {
    applyAuthToken();
    return axiosInstance.post(`${API_BASE_URL}/messages`, payload);
  },

  // Get all messages for a conversation
  getMessages: (conversationId: string): Promise<AxiosResponse> => {
    applyAuthToken();
    return axiosInstance.get(`${API_BASE_URL}/conversations/${conversationId}/messages`);
  },

  // Mark a message as read
  markMessageRead: (messageId: string): Promise<AxiosResponse> => {
    applyAuthToken();
    return axiosInstance.post(`${API_BASE_URL}/messages/${messageId}/read`);
  },

  // Soft delete a message
  deleteMessage: (messageId: string): Promise<AxiosResponse> => {
    applyAuthToken();
    return axiosInstance.delete(`${API_BASE_URL}/messages/${messageId}`);
  },
};
