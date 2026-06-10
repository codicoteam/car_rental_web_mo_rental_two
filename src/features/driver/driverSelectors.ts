import type { RootState } from '../../app/store';

export const selectDrivers = (state: RootState) => state.drivers.drivers;
export const selectLoading = (state: RootState) => state.drivers.loading;
export const selectError = (state: RootState) => state.drivers.error;