
// src/store/chatSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  createConversationThunk,
  getConversationsThunk,
  getConversationByIdThunk,
  sendMessageThunk,
  getMessagesThunk,
  markMessageReadThunk,
  deleteMessageThunk
} from './chatthunks';

export interface ChatState {
  conversations: any[];
  currentConversation: any | null;
  messages: any[];
  loading: boolean;
  error: any;
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createConversationThunk.pending, (s) => { s.loading = true; })
      .addCase(createConversationThunk.fulfilled, (s, a: PayloadAction<any>) => {
        s.loading = false;
        s.conversations.push(a.payload);
      })
      .addCase(createConversationThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })

      .addCase(getConversationsThunk.pending, (s) => { s.loading = true; })
      .addCase(getConversationsThunk.fulfilled, (s, a: PayloadAction<any[]>) => {
        s.loading = false;
        s.conversations = a.payload;
      })
      .addCase(getConversationsThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })

      .addCase(getConversationByIdThunk.pending, (s) => { s.loading = true; })
      .addCase(getConversationByIdThunk.fulfilled, (s, a: PayloadAction<any>) => {
        s.loading = false;
        s.currentConversation = a.payload;
      })
      .addCase(getConversationByIdThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })

      .addCase(sendMessageThunk.pending, (s) => { s.loading = true; })
      .addCase(sendMessageThunk.fulfilled, (s, a: PayloadAction<any>) => {
        s.loading = false;
        s.messages.push(a.payload);
      })
      .addCase(sendMessageThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })

      .addCase(getMessagesThunk.pending, (s) => { s.loading = true; })
      .addCase(getMessagesThunk.fulfilled, (s, a: PayloadAction<any[]>) => {
        s.loading = false;
        s.messages = a.payload;
      })
      .addCase(getMessagesThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })

      .addCase(markMessageReadThunk.fulfilled, (s, a: PayloadAction<any>) => {
        const msg = s.messages.find(m => m.id === a.payload.id);
        if (msg) msg.read = true;
      })

      .addCase(deleteMessageThunk.fulfilled, (s, a: PayloadAction<string>) => {
        s.messages = s.messages.filter(m => m.id !== a.payload);
      });
  }
});

export default chatSlice.reducer;