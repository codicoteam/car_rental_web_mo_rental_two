// src/store/chatThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { chatService } from '../chat/chatService';
import type { ConversationPayload, MessagePayload } from '../chat/chatService';

export const createConversationThunk = createAsyncThunk(
  'chat/createConversation',
  async (payload: ConversationPayload, { rejectWithValue }) => {
    try {
      const res = await chatService.createConversation(payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const getConversationsThunk = createAsyncThunk(
  'chat/getConversations',
  async (_, { rejectWithValue }) => {
    try {
      const res = await chatService.getConversations();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const getConversationByIdThunk = createAsyncThunk(
  'chat/getConversationById',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const res = await chatService.getConversationById(conversationId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const sendMessageThunk = createAsyncThunk(
  'chat/sendMessage',
  async (payload: MessagePayload, { rejectWithValue }) => {
    try {
      const res = await chatService.sendMessage(payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const getMessagesThunk = createAsyncThunk(
  'chat/getMessages',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const res = await chatService.getMessages(conversationId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const markMessageReadThunk = createAsyncThunk(
  'chat/markMessageRead',
  async (messageId: string, { rejectWithValue }) => {
    try {
      const res = await chatService.markMessageRead(messageId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const deleteMessageThunk = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId: string, { rejectWithValue }) => {
    try {
      await chatService.deleteMessage(messageId);
      return messageId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data);
    }
  }
);




