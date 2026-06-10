// src/features/reservations/reservationSelectors.ts
import type { RootState } from '../../app/store';

export const selectReservations = (state: RootState) => state.reservations.reservations;
export const selectReservationsLoading = (state: RootState) => state.reservations.isLoading;
export const selectReservationsError = (state: RootState) => state.reservations.error;