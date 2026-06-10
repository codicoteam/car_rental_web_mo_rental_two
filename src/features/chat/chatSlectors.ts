// src/store/chatSelectors.ts

import type { RootState } from '../../app/store';

export const selectConversations = (state: RootState) => state.chat.conversations;
export const selectCurrentConversation = (state: RootState) => state.chat.currentConversation;
export const selectMessages = (state: RootState) => state.chat.messages;
export const selectChatLoading = (state: RootState) => state.chat.loading;
export const selectChatError = (state: RootState) => state.chat.error;
