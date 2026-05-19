// src/features/reservations/reservationThunk.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAllReservations, type Reservation , deleteReservation , updateReservationStatus} from './reservationService';

export const fetchReservations = createAsyncThunk<Reservation[], void>(
  'reservations/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await getAllReservations();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reservations');
    }
  }
);

export const removeReservation = createAsyncThunk(
  'reservations/remove',
  async (reservationId: string, { rejectWithValue, dispatch }) => {
    try {
      await deleteReservation(reservationId);
      // Refresh the list after successful deletion
      dispatch(fetchReservations());
      return reservationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete reservation');
    }
  }
);

export const updateStatus = createAsyncThunk(
  'reservations/updateStatus',
  async ({ reservationId, status }: { reservationId: string; status: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await updateReservationStatus(reservationId, status);
      dispatch(fetchReservations());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update reservation status');
    }
  }
);