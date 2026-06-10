// src/features/reservations/reservationSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { fetchReservations } from './reservationthunks';
import type { Reservation } from './reservationService';

interface ReservationsState {
  reservations: Reservation[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ReservationsState = {
  reservations: [],
  isLoading: false,
  error: null
};

const reservationSlice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reservations = action.payload;
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export default reservationSlice.reducer;
export { fetchReservations };