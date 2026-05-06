import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sendChat } from '../api';

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, session_id }) => {
    const res = await sendChat(message, session_id);
    return res.data;
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],  // { role: 'user'|'assistant', content, tool_calls? }
    loading: false,
    error: null,
    sessionId: 'session-' + Date.now(),
  },
  reducers: {
    clearChat: (state) => {
      state.messages = [];
      state.sessionId = 'session-' + Date.now();
    },
    addUserMessage: (state, action) => {
      state.messages.push({ role: 'user', content: action.payload });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(sendMessage.fulfilled, (s, a) => {
        s.loading = false;
        s.messages.push({
          role: 'assistant',
          content: a.payload.response,
          tool_calls: a.payload.tool_calls || [],
        });
      })
      .addCase(sendMessage.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
        s.messages.push({
          role: 'assistant',
          content: '⚠️ Sorry, I encountered an error. Please try again.',
          tool_calls: [],
        });
      });
  },
});

export const { clearChat, addUserMessage } = chatSlice.actions;
export default chatSlice.reducer;
