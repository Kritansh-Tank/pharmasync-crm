import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchInteractions, fetchInteraction,
  createInteraction, updateInteraction, deleteInteraction,
} from '../api';

export const loadInteractions = createAsyncThunk('interactions/loadAll', async () => {
  const res = await fetchInteractions();
  return res.data;
});

export const loadInteraction = createAsyncThunk('interactions/loadOne', async (id) => {
  const res = await fetchInteraction(id);
  return res.data;
});

export const addInteraction = createAsyncThunk('interactions/add', async (data) => {
  const res = await createInteraction(data);
  return res.data;
});

export const editInteraction = createAsyncThunk('interactions/edit', async ({ id, data }) => {
  const res = await updateInteraction(id, data);
  return res.data;
});

export const removeInteraction = createAsyncThunk('interactions/remove', async (id) => {
  await deleteInteraction(id);
  return id;
});

const interactionsSlice = createSlice({
  name: 'interactions',
  initialState: { list: [], selected: null, loading: false, error: null },
  reducers: {
    clearSelected: (state) => { state.selected = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadInteractions.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadInteractions.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(loadInteractions.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })
      .addCase(loadInteraction.fulfilled, (s, a) => { s.selected = a.payload; })
      .addCase(addInteraction.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(editInteraction.fulfilled, (s, a) => {
        const idx = s.list.findIndex((i) => i.id === a.payload.id);
        if (idx !== -1) {
          // Preserve the nested hcp object — the PUT endpoint returns a flat
          // interaction without the joined hcp data, so we merge to keep it.
          s.list[idx] = { ...s.list[idx], ...a.payload };
        }
      })
      .addCase(removeInteraction.fulfilled, (s, a) => {
        s.list = s.list.filter((i) => i.id !== a.payload);
      });
  },
});

export const { clearSelected } = interactionsSlice.actions;
export default interactionsSlice.reducer;
