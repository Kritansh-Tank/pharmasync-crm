import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchHCPs, fetchHCP, createHCP, updateHCP, deleteHCP } from '../api';

export const loadHCPs = createAsyncThunk('hcps/loadAll', async () => {
  const res = await fetchHCPs();
  return res.data;
});

export const loadHCP = createAsyncThunk('hcps/loadOne', async (id) => {
  const res = await fetchHCP(id);
  return res.data;
});

export const addHCP = createAsyncThunk('hcps/add', async (data) => {
  const res = await createHCP(data);
  return res.data;
});

export const editHCP = createAsyncThunk('hcps/edit', async ({ id, data }) => {
  const res = await updateHCP(id, data);
  return res.data;
});

export const removeHCP = createAsyncThunk('hcps/remove', async (id) => {
  await deleteHCP(id);
  return id;
});

const hcpsSlice = createSlice({
  name: 'hcps',
  initialState: { list: [], selected: null, loading: false, error: null },
  reducers: {
    clearSelected: (state) => { state.selected = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadHCPs.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadHCPs.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(loadHCPs.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })
      .addCase(loadHCP.fulfilled, (s, a) => { s.selected = a.payload; })
      .addCase(addHCP.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(editHCP.fulfilled, (s, a) => {
        const idx = s.list.findIndex((h) => h.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
      })
      .addCase(removeHCP.fulfilled, (s, a) => {
        s.list = s.list.filter((h) => h.id !== a.payload);
      });
  },
});

export const { clearSelected } = hcpsSlice.actions;
export default hcpsSlice.reducer;
