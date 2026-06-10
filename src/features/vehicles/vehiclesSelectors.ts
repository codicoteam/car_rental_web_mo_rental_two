import type { RootState } from "../../app/store";

export const selectVehicles = (state: RootState) => state.vehicles.vehicles;
export const selectVehiclesLoading = (state: RootState) => state.vehicles.loading;
export const selectVehiclesError = (state: RootState) => state.vehicles.error;