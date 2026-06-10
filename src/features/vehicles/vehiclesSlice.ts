import { createSlice } from '@reduxjs/toolkit';
import { fetchVehicles } from './vehiclesThunks';
import type { Vehicle } from './vehiclesService';

interface VehiclesState {
  vehicles: Vehicle[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: VehiclesState = {
  vehicles: null,
  loading: false,
  error: null,
};

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    clearVehicles: (state) => {
      state.vehicles = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload;
        state.error = null;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.vehicles = null;
      });
  },
});

export const { clearVehicles } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;