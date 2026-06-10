import type { RootState } from '../../app/store'; 

export const selectProfile = (state: RootState) => state.profile.data;
export const selectProfileStatus = (state: RootState) => state.profile.status;
export const selectProfileError = (state: RootState) => state.profile.error;
